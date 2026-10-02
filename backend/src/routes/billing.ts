import express, { Router } from "express";
import Stripe from "stripe";
import { z } from "zod";
import type { Deps } from "../app.js";
import { requireAuth } from "../middleware/auth.js";
import { PLANS } from "../services/plans.js";

export function billingRoutes({ store, config }: Deps) {
  const r = Router();
  const stripe = config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null;

  r.get("/plans", (_req, res) => res.json({ plans: PLANS }));

  r.post("/checkout", requireAuth(store, config.jwtSecret), async (req, res) => {
    const p = z.object({ plan: z.enum(["PRO", "PREMIUM"]) }).safeParse(req.body);
    if (!p.success) return res.status(400).json({ error: "Invalid plan" });
    const price = config.stripePriceIds[p.data.plan];
    if (!stripe || !price) return res.status(503).json({ error: "Billing not configured" });
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      customer_email: req.user!.email,
      client_reference_id: req.user!.id,
      metadata: { plan: p.data.plan },
      success_url: `${config.appUrl}/settings?billing=success`,
      cancel_url: `${config.appUrl}/settings?billing=cancel`,
    });
    res.json({ url: session.url });
  });

  r.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    if (!stripe || !config.stripeWebhookSecret) return res.status(503).end();
    try {
      const event = stripe.webhooks.constructEvent(req.body, String(req.headers["stripe-signature"]), config.stripeWebhookSecret);
      if (event.type === "checkout.session.completed") {
        const s = event.data.object as Stripe.Checkout.Session;
        const plan = s.metadata?.plan;
        if (s.client_reference_id && (plan === "PRO" || plan === "PREMIUM")) {
          await store.updateUser(s.client_reference_id, { plan, stripeCustomerId: s.customer as string | null });
        }
      }
      res.json({ received: true });
    } catch { res.status(400).end(); }
  });
  return r;
}

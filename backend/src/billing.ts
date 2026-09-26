import Stripe from "stripe";
import { findUserByStripeCustomerId, getOrCreateUser, setPlan, setStripeCustomerId } from "./users.js";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : undefined;

export function isBillingConfigured() {
  return Boolean(stripe && process.env.STRIPE_PRICE_ID);
}

export async function createCheckoutSession(email: string) {
  if (!stripe || !process.env.STRIPE_PRICE_ID) {
    throw new Error("Billing is not configured");
  }
  const user = getOrCreateUser(email);
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: user.stripeCustomerId,
    customer_email: user.stripeCustomerId ? undefined : email,
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    success_url: `${frontendUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/billing/cancel`,
    metadata: { email }
  });
  return session;
}

export function verifyWebhookEvent(payload: Buffer, signature: string) {
  if (!stripe) throw new Error("Billing is not configured");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("Webhook secret is not configured");
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

export async function applyWebhookEvent(
  event: Stripe.Event,
  deps: { hasActiveSubscription: (customerId: string) => Promise<boolean> } = { hasActiveSubscription }
) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.metadata?.email ?? session.customer_email ?? undefined;
      if (email) {
        setPlan(email, "premium");
        if (typeof session.customer === "string") setStripeCustomerId(email, session.customer);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
      if (!customerId) break;
      const user = findUserByStripeCustomerId(customerId);
      if (user && !(await deps.hasActiveSubscription(customerId))) setPlan(user.email, "free");
      break;
    }
    default:
      break;
  }
}

export async function hasActiveSubscription(customerId: string): Promise<boolean> {
  if (!stripe) return false;
  const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 10 });
  return subscriptions.data.some((subscription) => subscription.status === "active" || subscription.status === "trialing");
}

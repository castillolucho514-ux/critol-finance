import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { applyWebhookEvent, createCheckoutSession, isBillingConfigured, verifyWebhookEvent } from "./billing.js";
import { findQuote, quotes } from "./quotes.js";
import { getOrCreateUser } from "./users.js";

const JWT_SECRET = process.env.JWT_SECRET;
const allowedOrigins = process.env.WEB_ORIGIN?.split(",") ?? ["http://localhost:3000"];
export const app = express();
app.use(cors({ origin: allowedOrigins }));
const authLimiter = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false });
const webhookLimiter = rateLimit({ windowMs: 60_000, limit: 100, standardHeaders: "draft-8", legacyHeaders: false });

// Registered before the global JSON body parser because Stripe webhook
// signature verification requires access to the raw request body.
app.post(
  "/api/billing/webhook",
  webhookLimiter,
  express.raw({ type: "application/json" }),
  async (request, response) => {
    const signature = request.header("stripe-signature");
    if (!signature) return response.status(400).json({ error: "Missing Stripe signature" });
    let event;
    try {
      event = verifyWebhookEvent(request.body, signature);
    } catch (error) {
      console.error("Stripe webhook signature verification failed:", error);
      return response.status(400).json({ error: "Invalid webhook signature" });
    }
    try {
      await applyWebhookEvent(event);
      return response.json({ received: true });
    } catch (error) {
      console.error("Failed to process Stripe webhook event:", error);
      return response.status(500).json({ error: "Failed to process webhook" });
    }
  }
);

app.use(express.json());

app.get("/health", (_request, response) => response.json({ status: "ok" }));
app.get("/api/quotes", (_request, response) => response.json(quotes));
app.get("/api/quotes/:symbol", (request, response) => {
  const quote = findQuote(request.params.symbol);
  return quote ? response.json(quote) : response.status(404).json({ error: "Quote not found" });
});
app.get("/api/users/me", authLimiter, (request, response) => {
  if (!JWT_SECRET) return response.status(500).json({ error: "Server authentication is not configured" });
  const authorization = request.header("authorization");
  if (!authorization?.startsWith("Bearer ")) return response.status(401).json({ error: "Authentication required" });
  try {
    const payload = jwt.verify(authorization.slice(7), JWT_SECRET);
    if (typeof payload === "string" || typeof payload.sub !== "string") return response.status(401).json({ error: "Invalid token" });
    const user = getOrCreateUser(payload.sub);
    return response.json({ ...payload, plan: user.plan });
  } catch {
    return response.status(401).json({ error: "Invalid token" });
  }
});
app.get("/api/alerts", (_request, response) => response.json([]));
app.post("/api/auth/token", authLimiter, (request, response) => {
  if (!JWT_SECRET) return response.status(500).json({ error: "Server authentication is not configured" });
  const email = typeof request.body.email === "string" ? request.body.email : "";
  if (!email) return response.status(400).json({ error: "Email is required" });
  const user = getOrCreateUser(email);
  return response.json({ token: jwt.sign({ sub: email, plan: user.plan }, JWT_SECRET, { expiresIn: "1h" }) });
});
app.post("/api/billing/checkout", authLimiter, async (request, response) => {
  if (!JWT_SECRET) return response.status(500).json({ error: "Server authentication is not configured" });
  const authorization = request.header("authorization");
  if (!authorization?.startsWith("Bearer ")) return response.status(401).json({ error: "Authentication required" });
  let email: string;
  try {
    const payload = jwt.verify(authorization.slice(7), JWT_SECRET);
    if (typeof payload === "string" || typeof payload.sub !== "string") {
      return response.status(401).json({ error: "Invalid token" });
    }
    email = payload.sub;
  } catch {
    return response.status(401).json({ error: "Invalid token" });
  }
  if (!isBillingConfigured()) return response.status(500).json({ error: "Billing is not configured" });
  try {
    const session = await createCheckoutSession(email);
    if (!session.url) return response.status(502).json({ error: "Stripe did not return a checkout URL" });
    return response.json({ url: session.url });
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : "Checkout failed" });
  }
});

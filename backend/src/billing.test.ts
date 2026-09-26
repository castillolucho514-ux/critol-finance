import assert from "node:assert/strict";
import test from "node:test";
import { applyWebhookEvent, isBillingConfigured } from "./billing.js";
import { getOrCreateUser, getUser, setPlan, setStripeCustomerId } from "./users.js";
import type Stripe from "stripe";

test("isBillingConfigured is false without Stripe env vars", () => {
  assert.equal(isBillingConfigured(), false);
});

test("applyWebhookEvent upgrades the user's plan on checkout completion", async () => {
  getOrCreateUser("checkout-user@example.com");
  const event = {
    type: "checkout.session.completed",
    data: {
      object: {
        metadata: { email: "checkout-user@example.com" },
        customer: "cus_abc"
      }
    }
  } as unknown as Stripe.Event;

  await applyWebhookEvent(event);

  assert.equal(getUser("checkout-user@example.com")?.plan, "premium");
  assert.equal(getUser("checkout-user@example.com")?.stripeCustomerId, "cus_abc");
});

test("applyWebhookEvent downgrades the user's plan on subscription deletion", async () => {
  getOrCreateUser("cancel-user@example.com");
  setPlan("cancel-user@example.com", "premium");
  setStripeCustomerId("cancel-user@example.com", "cus_cancel");
  const event = {
    type: "customer.subscription.deleted",
    data: { object: { customer: "cus_cancel" } }
  } as unknown as Stripe.Event;

  await applyWebhookEvent(event, { hasActiveSubscription: async () => false });

  assert.equal(getUser("cancel-user@example.com")?.plan, "free");
});

test("applyWebhookEvent keeps the premium plan when another active subscription remains", async () => {
  getOrCreateUser("multi-sub-user@example.com");
  setPlan("multi-sub-user@example.com", "premium");
  setStripeCustomerId("multi-sub-user@example.com", "cus_multi");
  const event = {
    type: "customer.subscription.deleted",
    data: { object: { customer: "cus_multi" } }
  } as unknown as Stripe.Event;

  await applyWebhookEvent(event, { hasActiveSubscription: async () => true });

  assert.equal(getUser("multi-sub-user@example.com")?.plan, "premium");
});

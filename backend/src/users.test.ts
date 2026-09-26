import assert from "node:assert/strict";
import test from "node:test";
import { getOrCreateUser, getUser, setPlan, setStripeCustomerId, findUserByStripeCustomerId } from "./users.js";

test("getOrCreateUser defaults new users to the free plan", () => {
  const user = getOrCreateUser("new-user@example.com");
  assert.equal(user.plan, "free");
  assert.equal(getUser("new-user@example.com")?.plan, "free");
});

test("setPlan upgrades an existing user and persists the change", () => {
  getOrCreateUser("upgrade-user@example.com");
  setPlan("upgrade-user@example.com", "premium");
  assert.equal(getUser("upgrade-user@example.com")?.plan, "premium");
});

test("setStripeCustomerId links a Stripe customer id and can be looked up", () => {
  getOrCreateUser("stripe-user@example.com");
  setStripeCustomerId("stripe-user@example.com", "cus_123");
  assert.equal(findUserByStripeCustomerId("cus_123")?.email, "stripe-user@example.com");
  assert.equal(findUserByStripeCustomerId("cus_missing"), undefined);
});

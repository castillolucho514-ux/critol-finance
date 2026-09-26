import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";

process.env.JWT_SECRET ??= "test-secret";
process.env.STRIPE_SECRET_KEY ??= "sk_test_dummy";
process.env.STRIPE_PRICE_ID ??= "price_dummy";

const { app } = await import("./app.js");
const { stripe } = await import("./billing.js");

function listen(): Promise<{ server: http.Server; url: string }> {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      resolve({ server, url: `http://127.0.0.1:${port}` });
    });
  });
}

test("POST /api/billing/checkout requires authentication", async () => {
  const { server, url } = await listen();
  try {
    const response = await fetch(`${url}/api/billing/checkout`, { method: "POST" });
    assert.equal(response.status, 401);
  } finally {
    server.close();
  }
});

test("POST /api/billing/checkout rejects a token without a subject claim", async () => {
  const { server, url } = await listen();
  try {
    const jwt = (await import("jsonwebtoken")).default;
    const token = jwt.sign({}, process.env.JWT_SECRET as string);
    const response = await fetch(`${url}/api/billing/checkout`, {
      method: "POST",
      headers: { authorization: "Bearer " + token }
    });
    assert.equal(response.status, 401);
    const body = (await response.json()) as { error: string };
    assert.equal(body.error, "Invalid token");
  } finally {
    server.close();
  }
});

test("POST /api/billing/checkout returns the Stripe checkout URL for a valid token", async () => {
  const { server, url } = await listen();
  const originalCreate = stripe?.checkout.sessions.create.bind(stripe.checkout.sessions);
  try {
    if (!stripe) throw new Error("Stripe client should be configured for this test");
    stripe.checkout.sessions.create = (async () =>
      ({ url: "https://checkout.stripe.com/session/test" })) as typeof stripe.checkout.sessions.create;
    const jwt = (await import("jsonwebtoken")).default;
    const token = jwt.sign({ sub: "happy-path-user@example.com" }, process.env.JWT_SECRET as string);
    const response = await fetch(`${url}/api/billing/checkout`, {
      method: "POST",
      headers: { authorization: "Bearer " + token }
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as { url: string };
    assert.equal(body.url, "https://checkout.stripe.com/session/test");
  } finally {
    if (stripe && originalCreate) stripe.checkout.sessions.create = originalCreate;
    server.close();
  }
});

test("POST /api/billing/checkout returns 502 when Stripe does not return a checkout URL", async () => {
  const { server, url } = await listen();
  const originalCreate = stripe?.checkout.sessions.create.bind(stripe.checkout.sessions);
  try {
    if (!stripe) throw new Error("Stripe client should be configured for this test");
    stripe.checkout.sessions.create = (async () => ({ url: null })) as typeof stripe.checkout.sessions.create;
    const jwt = (await import("jsonwebtoken")).default;
    const token = jwt.sign({ sub: "no-url-user@example.com" }, process.env.JWT_SECRET as string);
    const response = await fetch(`${url}/api/billing/checkout`, {
      method: "POST",
      headers: { authorization: "Bearer " + token }
    });
    assert.equal(response.status, 502);
    const body = (await response.json()) as { error: string };
    assert.equal(body.error, "Stripe did not return a checkout URL");
  } finally {
    if (stripe && originalCreate) stripe.checkout.sessions.create = originalCreate;
    server.close();
  }
});

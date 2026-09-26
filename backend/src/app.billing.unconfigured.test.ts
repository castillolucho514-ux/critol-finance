import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";

process.env.JWT_SECRET ??= "test-secret";

const { app } = await import("./app.js");

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

test("POST /api/billing/checkout returns 500 when billing is not configured", async () => {
  const { server, url } = await listen();
  try {
    const jwt = (await import("jsonwebtoken")).default;
    const token = jwt.sign({ sub: "checkout-route@example.com" }, process.env.JWT_SECRET as string);
    const response = await fetch(`${url}/api/billing/checkout`, {
      method: "POST",
      headers: { authorization: "Bearer " + token }
    });
    assert.equal(response.status, 500);
    const body = (await response.json()) as { error: string };
    assert.equal(body.error, "Billing is not configured");
  } finally {
    server.close();
  }
});

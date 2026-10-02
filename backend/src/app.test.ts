import test from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createApp } from "./app";
import { MemoryStore } from "./store";

async function boot() {
  const app = createApp({
    store: new MemoryStore(),
    ai: { reply: async () => "hello" },
    coinbase: { spotPrice: async (pair) => ({ pair, amount: "1", currency: "USD" }) },
    jwtSecret: "test-secret",
    adminEmails: ["admin@x.com"],
  });
  const server = app.listen(0);
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const call = async (method: string, path: string, body?: unknown, token?: string) => {
    const r = await fetch(base + path, {
      method,
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: "Bearer " + token } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: r.status, json: (await r.json()) as any };
  };
  return { server, call };
}

test("requires JWT secret", () => {
  assert.throws(() => createApp({ store: new MemoryStore(), ai: { reply: async () => "" }, coinbase: { spotPrice: async () => ({} as any) }, jwtSecret: "  " }));
});

test("normalizes market pair casing", async () => {
  const store = new MemoryStore();
  const app = createApp({
    store,
    ai: { reply: async () => "hello" },
    coinbase: { spotPrice: async (pair) => ({ pair, amount: "1", currency: "USD" }) },
    jwtSecret: "test-secret",
  });
  const server = app.listen(0);
  try {
    const port = (server.address() as AddressInfo).port;
    const base = `http://127.0.0.1:${port}`;
    const reg = await fetch(base + "/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "c@x.com", password: "password1" }),
    });
    const user = await store.findUserByEmail("c@x.com");
    assert.ok(user);
    await store.setPlan(user!.id, "PRO");
    const token = (await reg.json()).token;
    const r = await fetch(base + "/market/btc-usd", {
      headers: { authorization: "Bearer " + token },
    });
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { pair: "BTC-USD", amount: "1", currency: "USD" });
  } finally { server.close(); }
});

test("auth, chat, plans, admin", async () => {
  const { server, call } = await boot();
  try {
    const reg = await call("POST", "/auth/register", { email: "a@x.com", password: "password1" });
    assert.equal(reg.status, 201);
    assert.equal((await call("POST", "/auth/register", { email: "a@x.com", password: "password1" })).status, 409);
    assert.equal((await call("POST", "/auth/login", { email: "a@x.com", password: "wrongpass1" })).status, 401);
    const t = reg.json.token;
    assert.equal((await call("GET", "/me")).status, 401);
    assert.equal((await call("POST", "/chat", { message: "hi" }, t)).json.reply, "hello");
    assert.equal((await call("GET", "/market/BTC-USD", undefined, t)).status, 403);
    assert.equal((await call("PUT", "/subscription", { plan: "PRO" }, t)).status, 402);
    assert.equal((await call("GET", "/admin/users", undefined, t)).status, 403);
    const admin = (await call("POST", "/auth/register", { email: "admin@x.com", password: "password1" })).json.token;
    const users = await call("GET", "/admin/users", undefined, admin);
    assert.equal(users.json.length, 2);
    assert.equal((await call("PUT", `/admin/users/${reg.json.user.id}/plan`, { plan: "PRO" }, admin)).json.plan, "PRO");
    assert.equal((await call("GET", "/market/BTC-USD", undefined, t)).json.amount, "1");
  } finally { server.close(); }
});

test("free plan daily limit", async () => {
  const { server, call } = await boot();
  try {
    const t = (await call("POST", "/auth/register", { email: "b@x.com", password: "password1" })).json.token;
    for (let i = 0; i < 10; i++) assert.equal((await call("POST", "/chat", { message: "hi" }, t)).status, 200);
    assert.equal((await call("POST", "/chat", { message: "hi" }, t)).status, 429);
  } finally { server.close(); }
});

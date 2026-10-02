import test from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createApp } from "./app.js";
import { getConfig } from "./config.js";
import { MemoryStore } from "./database/store.js";
import { analyzeTrend } from "./ai/analysis.js";
import { detectSymbols } from "./ai/chatEngine.js";

const config = getConfig({ JWT_SECRET: "test-secret" } as NodeJS.ProcessEnv);

async function boot() {
  const store = new MemoryStore();
  const server = createApp(config, store).listen(0);
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const call = (path: string, init: RequestInit & { token?: string } = {}) =>
    fetch(base + path, {
      ...init,
      headers: { "content-type": "application/json", ...(init.token ? { authorization: "Bearer " + init.token } : {}) },
    });
  return { store, server, call };
}

test("register, login, plan gating and admin access", async () => {
  const { store, server, call } = await boot();
  try {
    const reg = await call("/api/auth/register", { method: "POST", body: JSON.stringify({ email: "a@b.co", password: "password123", name: "A" }) });
    assert.equal(reg.status, 201);
    const { token, user } = await reg.json();
    assert.equal(user.plan, "FREE");
    assert.equal(user.passwordHash, undefined);

    assert.equal((await call("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "a@b.co", password: "wrongpass1" }) })).status, 401);
    assert.equal((await call("/api/chat/history")).status, 401);
    assert.equal((await call("/api/market/portfolio", { token })).status, 402);
    assert.equal((await call("/api/admin/users", { token })).status, 403);

    await store.updateUser(user.id, { role: "ADMIN" });
    assert.equal((await call("/api/admin/users", { token })).status, 200);
    await call("/api/market/watchlist", { method: "POST", token, body: JSON.stringify({ symbol: "btc" }) });
    assert.deepEqual((await (await call("/api/market/watchlist", { token })).json()).symbols, ["BTC"]);
  } finally { server.close(); }
});

test("analysis helpers", () => {
  assert.deepEqual(detectSymbols("Should I buy bitcoin or ETH?"), ["ETH", "BTC"]);
  const candles = Array.from({ length: 30 }, (_, i) => ({ time: i, low: 0, high: 0, open: 0, close: 100 + i * 3, volume: 1 }));
  assert.equal(analyzeTrend(candles).trend, "up");
});

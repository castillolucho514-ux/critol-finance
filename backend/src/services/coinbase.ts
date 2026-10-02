import { randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import type { Config } from "../config.js";

const PUBLIC_API = "https://api.coinbase.com";
const EXCHANGE_API = "https://api.exchange.coinbase.com";
const TRADE_HOST = "api.coinbase.com";
export const SYMBOL_RE = /^[A-Z0-9]{2,10}$/;

export interface Candle { time: number; low: number; high: number; open: number; close: number; volume: number }

export class CoinbaseService {
  constructor(private cfg: Pick<Config, "coinbaseApiKeyName" | "coinbaseApiPrivateKey">, private fetchFn: typeof fetch = fetch) {}

  get authenticated() { return Boolean(this.cfg.coinbaseApiKeyName && this.cfg.coinbaseApiPrivateKey); }

  async getSpotPrice(symbol: string, quote = "USD"): Promise<number> {
    const res = await this.fetchFn(`${PUBLIC_API}/v2/prices/${symbol}-${quote}/spot`);
    if (!res.ok) throw new Error(`Coinbase price error ${res.status}`);
    const body = (await res.json()) as { data: { amount: string } };
    return Number(body.data.amount);
  }

  async getHistory(symbol: string, days = 30): Promise<Candle[]> {
    const res = await this.fetchFn(`${EXCHANGE_API}/products/${symbol}-USD/candles?granularity=86400`);
    if (!res.ok) throw new Error(`Coinbase history error ${res.status}`);
    const rows = (await res.json()) as number[][];
    return rows
      .slice(0, days)
      .map(([time, low, high, open, close, volume]) => ({ time, low, high, open, close, volume }))
      .reverse();
  }

  private async signed<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
    if (!this.authenticated) throw new Error("Coinbase credentials not configured");
    const name = this.cfg.coinbaseApiKeyName!;
    const token = jwt.sign(
      { sub: name, iss: "cdp", uri: `${method} ${TRADE_HOST}${path}` },
      this.cfg.coinbaseApiPrivateKey!,
      { algorithm: "ES256", expiresIn: 120, notBefore: 0, header: { alg: "ES256", kid: name, nonce: randomBytes(16).toString("hex") } as never },
    );
    const res = await this.fetchFn(`https://${TRADE_HOST}${path}`, {
      method,
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`Coinbase API error ${res.status}`);
    return (await res.json()) as T;
  }

  async getBalances() {
    const data = await this.signed<{ accounts: { currency: string; available_balance: { value: string } }[] }>(
      "GET", "/api/v3/brokerage/accounts",
    );
    return data.accounts
      .map((a) => ({ currency: a.currency, balance: Number(a.available_balance.value) }))
      .filter((a) => a.balance > 0);
  }

  async getPortfolio() {
    const balances = await this.getBalances();
    const holdings = await Promise.all(
      balances.map(async (b) => {
        const price = b.currency === "USD" ? 1 : await this.getSpotPrice(b.currency).catch(() => 0);
        return { ...b, price, value: b.balance * price };
      }),
    );
    return { holdings, totalUsd: holdings.reduce((s, h) => s + h.value, 0) };
  }

  placeMarketOrder(symbol: string, side: "BUY" | "SELL", amount: number) {
    const order_configuration =
      side === "BUY"
        ? { market_market_ioc: { quote_size: amount.toFixed(2) } }
        : { market_market_ioc: { base_size: String(amount) } };
    return this.signed("POST", "/api/v3/brokerage/orders", {
      client_order_id: randomBytes(16).toString("hex"),
      product_id: `${symbol}-USD`,
      side,
      order_configuration,
    });
  }
}

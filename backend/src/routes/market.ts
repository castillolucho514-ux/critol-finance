import { Router } from "express";
import { z } from "zod";
import type { Deps } from "../app.js";
import { requireAuth, requirePlan } from "../middleware/auth.js";
import { SYMBOL_RE } from "../services/coinbase.js";
import { analyzeTrend, assessRisk } from "../ai/analysis.js";

const symbolSchema = z.string().toUpperCase().regex(SYMBOL_RE);

export function marketRoutes({ store, config, coinbase }: Deps) {
  const r = Router();
  r.use(requireAuth(store, config.jwtSecret));

  r.get("/price/:symbol", async (req, res) => {
    const s = symbolSchema.safeParse(req.params.symbol);
    if (!s.success) return res.status(400).json({ error: "Invalid symbol" });
    try {
      await store.recordUsage(req.user!.id, "price");
      res.json({ symbol: s.data, usd: await coinbase.getSpotPrice(s.data) });
    } catch { res.status(502).json({ error: "Market data unavailable" }); }
  });

  r.get("/analysis/:symbol", requirePlan("PRO"), async (req, res) => {
    const s = symbolSchema.safeParse(req.params.symbol);
    if (!s.success) return res.status(400).json({ error: "Invalid symbol" });
    try {
      const candles = await coinbase.getHistory(s.data, 30);
      res.json({ symbol: s.data, candles, trend: analyzeTrend(candles), risk: assessRisk(candles) });
    } catch { res.status(502).json({ error: "Market data unavailable" }); }
  });

  r.get("/watchlist", async (req, res) => res.json({ symbols: await store.getWatchlist(req.user!.id) }));
  r.post("/watchlist", async (req, res) => {
    const s = symbolSchema.safeParse(req.body?.symbol);
    if (!s.success) return res.status(400).json({ error: "Invalid symbol" });
    await store.addWatch(req.user!.id, s.data);
    res.status(201).json({ symbols: await store.getWatchlist(req.user!.id) });
  });
  r.delete("/watchlist/:symbol", async (req, res) => {
    const s = symbolSchema.safeParse(req.params.symbol);
    if (!s.success) return res.status(400).json({ error: "Invalid symbol" });
    await store.removeWatch(req.user!.id, s.data);
    res.json({ symbols: await store.getWatchlist(req.user!.id) });
  });

  r.get("/portfolio", requirePlan("PRO"), async (_req, res) => {
    try { res.json(await coinbase.getPortfolio()); }
    catch { res.status(502).json({ error: "Coinbase unavailable or not configured" }); }
  });

  r.post("/orders", requirePlan("PREMIUM"), async (req, res) => {
    const p = z.object({
      symbol: symbolSchema, side: z.enum(["BUY", "SELL"]),
      amount: z.number().positive().max(10000), confirm: z.literal(true),
    }).safeParse(req.body);
    if (!p.success) return res.status(400).json({ error: "Invalid order; explicit confirm:true required" });
    try {
      await store.recordUsage(req.user!.id, "order");
      res.status(201).json(await coinbase.placeMarketOrder(p.data.symbol, p.data.side, p.data.amount));
    } catch { res.status(502).json({ error: "Order failed" }); }
  });
  return r;
}

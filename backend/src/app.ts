import express, { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { PLANS, Plan } from "./plans";
import type { Store } from "./store";
import type { AI } from "./ai";
import type { Coinbase } from "./coinbase";

export interface Deps { store: Store; ai: AI; coinbase: Coinbase; jwtSecret: string; adminEmails?: string[] }
type AuthReq = Request & { auth?: { id: string; role: string } };

const creds = z.object({ email: z.string().email().max(254), password: z.string().min(8).max(128) });
const planSchema = z.object({ plan: z.enum(["FREE", "PRO", "PREMIUM"]) });
const chatSchema = z.object({ message: z.string().min(1).max(4000) });

export function createApp(deps: Deps) {
  if (!deps.jwtSecret) throw new Error("JWT_SECRET is required");
  const { store, ai, coinbase, jwtSecret } = deps;
  const admins = (deps.adminEmails ?? []).map((e) => e.toLowerCase());
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));
  const allowedOrigins = (process.env.CORS_ORIGIN ?? "*").split(",").map((origin) => origin.trim()).filter(Boolean);
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (allowedOrigins.includes("*")) res.setHeader("Access-Control-Allow-Origin", "*");
    else {
      res.vary("Origin");
      if (req.headers.origin && allowedOrigins.includes(req.headers.origin))
        res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
    }
    res.setHeader("Access-Control-Allow-Headers", "content-type, authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
    if (req.method === "OPTIONS") return void res.sendStatus(204);
    next();
  });

  const wrap = (fn: (req: AuthReq, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);
  const sign = (u: { id: string; role: string }) => jwt.sign({ sub: u.id, role: u.role }, jwtSecret, { expiresIn: "7d" });
  const auth = (req: AuthReq, res: Response, next: NextFunction) => {
    const h = req.headers.authorization ?? "";
    try {
      const p = jwt.verify(h.replace(/^Bearer /, ""), jwtSecret) as jwt.JwtPayload;
      req.auth = { id: String(p.sub), role: String(p.role) };
      next();
    } catch { res.status(401).json({ error: "unauthorized" }); }
  };
  const adminOnly = async (req: AuthReq, res: Response, next: NextFunction) => {
    const u = req.auth && (await store.findUserById(req.auth.id));
    if (u?.role !== "ADMIN") return void res.status(403).json({ error: "forbidden" });
    next();
  };
  const pub = (u: { id: string; email: string; role: string; plan: string }) => ({ id: u.id, email: u.email, role: u.role, plan: u.plan });

  app.get("/health", (_q, res) => res.json({ ok: true }));
  app.get("/plans", (_q, res) => res.json(PLANS));

  app.post("/auth/register", wrap(async (req, res) => {
    const p = creds.safeParse(req.body);
    if (!p.success) return res.status(400).json({ error: "invalid input" });
    const email = p.data.email.toLowerCase();
    if (await store.findUserByEmail(email)) return res.status(409).json({ error: "email taken" });
    const u = await store.createUser({ email, passwordHash: await bcrypt.hash(p.data.password, 10), role: admins.includes(email) ? "ADMIN" : "USER" });
    res.status(201).json({ token: sign(u), user: pub(u) });
  }));

  app.post("/auth/login", wrap(async (req, res) => {
    const p = creds.safeParse(req.body);
    if (!p.success) return res.status(400).json({ error: "invalid input" });
    const u = await store.findUserByEmail(p.data.email.toLowerCase());
    if (!u || !(await bcrypt.compare(p.data.password, u.passwordHash))) return res.status(401).json({ error: "invalid credentials" });
    res.json({ token: sign(u), user: pub(u) });
  }));

  app.get("/me", auth, wrap(async (req, res) => {
    const u = await store.findUserById(req.auth!.id);
    if (!u) return res.status(404).json({ error: "not found" });
    res.json(pub(u));
  }));

  // Plan change. Payment-provider verification must gate this in production; here only PRO/PREMIUM upgrades are self-service stubs disabled unless ALLOW_SELF_SERVICE_PLAN=true.
  app.put("/subscription", auth, wrap(async (req, res) => {
    const p = planSchema.safeParse(req.body);
    if (!p.success) return res.status(400).json({ error: "invalid plan" });
    if (p.data.plan !== "FREE" && process.env.ALLOW_SELF_SERVICE_PLAN !== "true")
      return res.status(402).json({ error: "payment required" });
    res.json(pub((await store.setPlan(req.auth!.id, p.data.plan))!));
  }));

  app.get("/chat", auth, wrap(async (req, res) => res.json(await store.listMessages(req.auth!.id, 50))));

  app.post("/chat", auth, wrap(async (req, res) => {
    const p = chatSchema.safeParse(req.body);
    if (!p.success) return res.status(400).json({ error: "invalid input" });
    const u = (await store.findUserById(req.auth!.id))!;
    const day = new Date(); day.setUTCHours(0, 0, 0, 0);
    if ((await store.countUserMessagesSince(u.id, day)) >= PLANS[u.plan].dailyMessages)
      return res.status(429).json({ error: "daily limit reached; upgrade your plan" });
    let context = "";
    const m = p.data.message.match(/\b([A-Z]{2,6})-(USD|EUR)\b/);
    if (m && PLANS[u.plan].coinbase) {
      try { const s = await coinbase.spotPrice(m[0]); context = `${s.pair} spot price: ${s.amount} ${s.currency}`; } catch { /* ignore */ }
    }
    await store.addMessage(u.id, "user", p.data.message);
    const history = (await store.listMessages(u.id, 20)).map((x) => ({ role: x.role, content: x.content }));
    const reply = await ai.reply(history, context);
    await store.addMessage(u.id, "assistant", reply);
    res.json({ reply });
  }));

  app.get("/market/:pair", auth, wrap(async (req, res) => {
    const u = (await store.findUserById(req.auth!.id))!;
    if (!PLANS[u.plan].coinbase) return res.status(403).json({ error: "plan upgrade required" });
    try { res.json(await coinbase.spotPrice(String(req.params.pair).toUpperCase())); }
    catch { res.status(400).json({ error: "unavailable" }); }
  }));

  app.get("/admin/users", auth, adminOnly, wrap(async (_q, res) => res.json((await store.listUsers()).map(pub))));
  app.put("/admin/users/:id/plan", auth, adminOnly, wrap(async (req, res) => {
    const p = planSchema.safeParse(req.body);
    if (!p.success) return res.status(400).json({ error: "invalid plan" });
    const u = await store.setPlan(String(req.params.id), p.data.plan as Plan);
    if (!u) return res.status(404).json({ error: "not found" });
    res.json(pub(u));
  }));

  app.use((err: unknown, _q: Request, res: Response, _n: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "internal error" });
  });
  return app;
}

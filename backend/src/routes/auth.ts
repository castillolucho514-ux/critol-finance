import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Deps } from "../app.js";
import { requireAuth, signToken } from "../middleware/auth.js";

const publicUser = (u: import("../database/store.js").User) => {
  const { passwordHash: _p, stripeCustomerId: _s, ...rest } = u;
  return rest;
};
export { publicUser };

export function authRoutes({ store, config }: Deps) {
  const r = Router();
  const creds = z.object({ email: z.string().email().toLowerCase(), password: z.string().min(8).max(128) });

  r.post("/register", async (req, res) => {
    const p = creds.extend({ name: z.string().min(1).max(80), language: z.enum(["es", "en"]).default("es") }).safeParse(req.body);
    if (!p.success) return res.status(400).json({ error: p.error.flatten() });
    if (await store.findUserByEmail(p.data.email)) return res.status(409).json({ error: "Email already registered" });
    const user = await store.createUser({
      email: p.data.email, name: p.data.name, language: p.data.language,
      passwordHash: await bcrypt.hash(p.data.password, 12),
    });
    res.status(201).json({ token: signToken(user, config.jwtSecret), user: publicUser(user) });
  });

  r.post("/login", async (req, res) => {
    const p = creds.safeParse(req.body);
    if (!p.success) return res.status(400).json({ error: "Invalid credentials" });
    const user = await store.findUserByEmail(p.data.email);
    if (!user || !(await bcrypt.compare(p.data.password, user.passwordHash))) return res.status(401).json({ error: "Invalid credentials" });
    res.json({ token: signToken(user, config.jwtSecret), user: publicUser(user) });
  });

  r.get("/me", requireAuth(store, config.jwtSecret), (req, res) => res.json({ user: publicUser(req.user!) }));

  r.patch("/me", requireAuth(store, config.jwtSecret), async (req, res) => {
    const p = z.object({
      name: z.string().min(1).max(80).optional(),
      language: z.enum(["es", "en"]).optional(),
      riskProfile: z.enum(["conservative", "moderate", "aggressive"]).optional(),
    }).safeParse(req.body);
    if (!p.success) return res.status(400).json({ error: p.error.flatten() });
    res.json({ user: publicUser(await store.updateUser(req.user!.id, p.data)) });
  });
  return r;
}

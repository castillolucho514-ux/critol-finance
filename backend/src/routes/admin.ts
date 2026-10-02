import { Router } from "express";
import { z } from "zod";
import type { Deps } from "../app.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { publicUser } from "./auth.js";

export function adminRoutes({ store, config }: Deps) {
  const r = Router();
  r.use(requireAuth(store, config.jwtSecret), requireAdmin);

  r.get("/users", async (_req, res) => res.json({ users: (await store.listUsers()).map(publicUser) }));

  r.patch("/users/:id", async (req, res) => {
    const p = z.object({ plan: z.enum(["FREE", "PRO", "PREMIUM"]).optional(), role: z.enum(["USER", "ADMIN"]).optional() }).safeParse(req.body);
    if (!p.success) return res.status(400).json({ error: p.error.flatten() });
    if (!(await store.findUserById(req.params.id))) return res.status(404).json({ error: "Not found" });
    res.json({ user: publicUser(await store.updateUser(req.params.id, p.data)) });
  });

  r.get("/analytics", async (_req, res) => {
    const users = await store.listUsers();
    const byPlan = { FREE: 0, PRO: 0, PREMIUM: 0 } as Record<string, number>;
    users.forEach((u) => byPlan[u.plan]++);
    res.json({ totalUsers: users.length, byPlan, apiUsage: await store.usageSummary() });
  });
  return r;
}

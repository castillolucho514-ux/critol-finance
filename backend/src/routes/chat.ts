import { Router } from "express";
import { z } from "zod";
import type { Deps } from "../app.js";
import { requireAuth } from "../middleware/auth.js";
import { PLANS } from "../services/plans.js";

export function chatRoutes({ store, config, engine }: Deps) {
  const r = Router();
  r.use(requireAuth(store, config.jwtSecret));

  r.get("/history", async (req, res) => res.json({ messages: await store.recentMessages(req.user!.id, 50) }));

  r.post("/", async (req, res) => {
    const p = z.object({ message: z.string().min(1).max(2000) }).safeParse(req.body);
    if (!p.success) return res.status(400).json({ error: p.error.flatten() });
    const user = req.user!;
    const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0);
    const limit = PLANS[user.plan].dailyChats;
    if ((await store.countUserMessagesSince(user.id, dayStart)) >= limit) {
      return res.status(402).json({ error: "Daily chat limit reached. Upgrade your plan." });
    }
    const history = await store.recentMessages(user.id, 10);
    await store.addMessage(user.id, "user", p.data.message);
    await store.recordUsage(user.id, "chat");
    try {
      const { reply, suggestions } = await engine.reply(user, p.data.message, history);
      await store.addMessage(user.id, "assistant", reply);
      res.json({ reply, suggestions: PLANS[user.plan].trading || user.plan === "PRO" ? suggestions : [] });
    } catch {
      res.status(502).json({ error: "AI provider error" });
    }
  });
  return r;
}

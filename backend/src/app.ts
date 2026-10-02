import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import type { Config } from "./config.js";
import type { Store } from "./database/store.js";
import { CoinbaseService } from "./services/coinbase.js";
import { ChatEngine } from "./ai/chatEngine.js";
import { authRoutes } from "./routes/auth.js";
import { chatRoutes } from "./routes/chat.js";
import { marketRoutes } from "./routes/market.js";
import { billingRoutes } from "./routes/billing.js";
import { adminRoutes } from "./routes/admin.js";

export interface Deps { config: Config; store: Store; coinbase: CoinbaseService; engine: ChatEngine }

export function createApp(config: Config, store: Store, coinbase = new CoinbaseService(config)) {
  const deps: Deps = { config, store, coinbase, engine: new ChatEngine(config, coinbase) };
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(rateLimit({ windowMs: 60_000, limit: 120 }));

  // Stripe webhook needs the raw body, so mount billing before the JSON parser
  app.use("/api/billing", billingRoutes(deps));
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/auth", rateLimit({ windowMs: 15 * 60_000, limit: 50 }), authRoutes(deps));
  app.use("/api/chat", chatRoutes(deps));
  app.use("/api/market", marketRoutes(deps));
  app.use("/api/admin", adminRoutes(deps));
  return app;
}

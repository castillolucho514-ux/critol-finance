import { createApp } from "./app";
import { PrismaStore } from "./prismaStore";
import { MemoryStore } from "./store";
import { createAI } from "./ai";
import { createCoinbase } from "./coinbase";

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error("JWT_SECRET environment variable is required");

const store = process.env.DATABASE_URL ? new PrismaStore() : new MemoryStore();
if (!process.env.DATABASE_URL) {
  console.log("DATABASE_URL not set; using MemoryStore fallback");
}

const app = createApp({
  store,
  ai: createAI(),
  coinbase: createCoinbase(),
  jwtSecret,
  adminEmails: (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
});
app.listen(Number(process.env.PORT ?? 4000), () => console.log("API listening"));

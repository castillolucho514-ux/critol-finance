import { createApp } from "./app";
import { PrismaStore } from "./prismaStore";
import { createAI } from "./ai";
import { createCoinbase } from "./coinbase";

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error("JWT_SECRET environment variable is required");

const app = createApp({
  store: new PrismaStore(),
  ai: createAI(),
  coinbase: createCoinbase(),
  jwtSecret,
  adminEmails: (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
});
app.listen(Number(process.env.PORT ?? 4000), () => console.log("API listening"));

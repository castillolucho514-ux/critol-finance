import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { findQuote, quotes } from "./quotes.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "development-only-secret";
const allowedOrigins = process.env.WEB_ORIGIN?.split(",") ?? ["http://localhost:3000"];
export const app = express();
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
const authLimiter = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false });

app.get("/health", (_request, response) => response.json({ status: "ok" }));
app.get("/api/quotes", (_request, response) => response.json(quotes));
app.get("/api/quotes/:symbol", (request, response) => {
  const quote = findQuote(request.params.symbol);
  return quote ? response.json(quote) : response.status(404).json({ error: "Quote not found" });
});
app.get("/api/users/me", authLimiter, (request, response) => {
  const authorization = request.header("authorization");
  if (!authorization?.startsWith("Bearer ")) return response.status(401).json({ error: "Authentication required" });
  try {
    return response.json(jwt.verify(authorization.slice(7), JWT_SECRET));
  } catch {
    return response.status(401).json({ error: "Invalid token" });
  }
});
app.get("/api/alerts", (_request, response) => response.json([]));
app.post("/api/auth/token", authLimiter, (request, response) => {
  const email = typeof request.body.email === "string" ? request.body.email : "";
  if (!email) return response.status(400).json({ error: "Email is required" });
  return response.json({ token: jwt.sign({ sub: email, plan: "free" }, JWT_SECRET, { expiresIn: "1h" }) });
});

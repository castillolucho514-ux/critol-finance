import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import { findQuote, quotes } from "./quotes.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "development-only-secret";
const allowedOrigins = process.env.WEB_ORIGIN?.split(",") ?? ["http://localhost:3000"];
const authAttempts = new Map<string, { count: number; resetAt: number }>();

export const app = express();
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/health", (_request, response) => response.json({ status: "ok" }));
app.get("/api/quotes", (_request, response) => response.json(quotes));
app.get("/api/quotes/:symbol", (request, response) => {
  const quote = findQuote(request.params.symbol);
  return quote ? response.json(quote) : response.status(404).json({ error: "Quote not found" });
});
app.get("/api/users/me", (request, response) => {
  const authorization = request.header("authorization");
  if (!authorization?.startsWith("Bearer ")) return response.status(401).json({ error: "Authentication required" });
  try {
    return response.json(jwt.verify(authorization.slice(7), JWT_SECRET));
  } catch {
    return response.status(401).json({ error: "Invalid token" });
  }
});
app.get("/api/alerts", (_request, response) => response.json([]));
app.post("/api/auth/token", (request, response) => {
  const key = request.ip ?? "unknown";
  const now = Date.now();
  const attempt = authAttempts.get(key);
  if (!attempt || attempt.resetAt <= now) {
    authAttempts.set(key, { count: 1, resetAt: now + 60_000 });
  } else if (attempt.count >= 10) {
    return response.status(429).json({ error: "Too many requests" });
  } else {
    attempt.count += 1;
  }
  const email = typeof request.body.email === "string" ? request.body.email : "";
  if (!email) return response.status(400).json({ error: "Email is required" });
  return response.json({ token: jwt.sign({ sub: email, plan: "free" }, JWT_SECRET, { expiresIn: "1h" }) });
});

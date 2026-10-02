import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Store, User } from "../database/store.js";
import type { Plan } from "../services/plans.js";

declare module "express-serve-static-core" {
  interface Request { user?: User }
}

export const signToken = (user: Pick<User, "id">, secret: string) =>
  jwt.sign({ sub: user.id }, secret, { expiresIn: "7d" });

export const requireAuth = (store: Store, secret: string) => async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Missing token" });
  try {
    const payload = jwt.verify(header.slice(7), secret) as jwt.JwtPayload;
    const user = await store.findUserById(String(payload.sub));
    if (!user) return res.status(401).json({ error: "Invalid token" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) =>
  req.user?.role === "ADMIN" ? next() : res.status(403).json({ error: "Admin only" });

const rank: Record<Plan, number> = { FREE: 0, PRO: 1, PREMIUM: 2 };
export const requirePlan = (min: Plan) => (req: Request, res: Response, next: NextFunction) =>
  req.user && rank[req.user.plan] >= rank[min] ? next() : res.status(402).json({ error: `Requires ${min} plan` });

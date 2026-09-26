export type Plan = "free" | "premium";

export type User = { email: string; plan: Plan; stripeCustomerId?: string };

// In-memory store used until the Postgres-backed users table (see
// src/models/schema.sql) is wired up to a real database client.
const users = new Map<string, User>();

export function getOrCreateUser(email: string): User {
  const existing = users.get(email);
  if (existing) return existing;
  const created: User = { email, plan: "free" };
  users.set(email, created);
  return created;
}

export function getUser(email: string): User | undefined {
  return users.get(email);
}

export function setPlan(email: string, plan: Plan): User {
  const user = getOrCreateUser(email);
  user.plan = plan;
  users.set(email, user);
  return user;
}

export function setStripeCustomerId(email: string, stripeCustomerId: string): User {
  const user = getOrCreateUser(email);
  user.stripeCustomerId = stripeCustomerId;
  users.set(email, user);
  return user;
}

export function findUserByStripeCustomerId(stripeCustomerId: string): User | undefined {
  for (const user of users.values()) {
    if (user.stripeCustomerId === stripeCustomerId) return user;
  }
  return undefined;
}

import { randomUUID } from "node:crypto";
import type { Plan } from "../services/plans.js";

export type Role = "USER" | "ADMIN";
export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  plan: Plan;
  language: "es" | "en";
  riskProfile: "conservative" | "moderate" | "aggressive";
  stripeCustomerId?: string | null;
  createdAt: Date;
}
export interface Message {
  id: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface Store {
  createUser(u: Pick<User, "email" | "name" | "passwordHash" | "language"> & { role?: Role }): Promise<User>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  updateUser(id: string, data: Partial<Omit<User, "id">>): Promise<User>;
  listUsers(): Promise<User[]>;
  addMessage(userId: string, role: Message["role"], content: string): Promise<Message>;
  recentMessages(userId: string, limit: number): Promise<Message[]>;
  countUserMessagesSince(userId: string, since: Date): Promise<number>;
  getWatchlist(userId: string): Promise<string[]>;
  addWatch(userId: string, symbol: string): Promise<void>;
  removeWatch(userId: string, symbol: string): Promise<void>;
  recordUsage(userId: string, endpoint: string): Promise<void>;
  usageSummary(): Promise<Record<string, number>>;
}

export class MemoryStore implements Store {
  private users = new Map<string, User>();
  private messages: Message[] = [];
  private watch = new Map<string, Set<string>>();
  private usage: { userId: string; endpoint: string }[] = [];

  async createUser(u: Parameters<Store["createUser"]>[0]) {
    const user: User = {
      id: randomUUID(), role: "USER", plan: "FREE", riskProfile: "moderate", createdAt: new Date(), ...u,
    };
    this.users.set(user.id, user);
    return user;
  }
  async findUserByEmail(email: string) {
    return [...this.users.values()].find((u) => u.email === email) ?? null;
  }
  async findUserById(id: string) { return this.users.get(id) ?? null; }
  async updateUser(id: string, data: Partial<Omit<User, "id">>) {
    const u = this.users.get(id);
    if (!u) throw new Error("User not found");
    Object.assign(u, data);
    return u;
  }
  async listUsers() { return [...this.users.values()]; }
  async addMessage(userId: string, role: Message["role"], content: string) {
    const m = { id: randomUUID(), userId, role, content, createdAt: new Date() };
    this.messages.push(m);
    return m;
  }
  async recentMessages(userId: string, limit: number) {
    return this.messages.filter((m) => m.userId === userId).slice(-limit);
  }
  async countUserMessagesSince(userId: string, since: Date) {
    return this.messages.filter((m) => m.userId === userId && m.role === "user" && m.createdAt >= since).length;
  }
  async getWatchlist(userId: string) { return [...(this.watch.get(userId) ?? [])]; }
  async addWatch(userId: string, symbol: string) {
    if (!this.watch.has(userId)) this.watch.set(userId, new Set());
    this.watch.get(userId)!.add(symbol);
  }
  async removeWatch(userId: string, symbol: string) { this.watch.get(userId)?.delete(symbol); }
  async recordUsage(userId: string, endpoint: string) { this.usage.push({ userId, endpoint }); }
  async usageSummary() {
    const out: Record<string, number> = {};
    for (const u of this.usage) out[u.endpoint] = (out[u.endpoint] ?? 0) + 1;
    return out;
  }
}

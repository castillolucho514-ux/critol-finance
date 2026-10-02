import { randomUUID } from "node:crypto";
import type { Plan } from "./plans";

export type Role = "USER" | "ADMIN";
export interface User { id: string; email: string; passwordHash: string; role: Role; plan: Plan; createdAt: Date }
export interface Message { id: string; userId: string; role: string; content: string; createdAt: Date }

export interface Store {
  createUser(d: { email: string; passwordHash: string; role: Role }): Promise<User>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  listUsers(): Promise<User[]>;
  setPlan(id: string, plan: Plan): Promise<User | null>;
  addMessage(userId: string, role: string, content: string): Promise<Message>;
  listMessages(userId: string, limit: number): Promise<Message[]>;
  countUserMessagesSince(userId: string, since: Date): Promise<number>;
}

export class MemoryStore implements Store {
  users: User[] = [];
  messages: Message[] = [];
  async createUser(d: { email: string; passwordHash: string; role: Role }) {
    const u: User = { id: randomUUID(), plan: "FREE", createdAt: new Date(), ...d };
    this.users.push(u);
    return u;
  }
  async findUserByEmail(email: string) { return this.users.find((u) => u.email === email) ?? null; }
  async findUserById(id: string) { return this.users.find((u) => u.id === id) ?? null; }
  async listUsers() { return [...this.users]; }
  async setPlan(id: string, plan: Plan) {
    const u = this.users.find((x) => x.id === id);
    if (u) u.plan = plan;
    return u ?? null;
  }
  async addMessage(userId: string, role: string, content: string) {
    const m = { id: randomUUID(), userId, role, content, createdAt: new Date() };
    this.messages.push(m);
    return m;
  }
  async listMessages(userId: string, limit: number) {
    return this.messages.filter((m) => m.userId === userId).slice(-limit);
  }
  async countUserMessagesSince(userId: string, since: Date) {
    return this.messages.filter((m) => m.userId === userId && m.role === "user" && m.createdAt >= since).length;
  }
}

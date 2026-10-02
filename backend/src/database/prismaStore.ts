import { PrismaClient } from "@prisma/client";
import type { Message, Store, User } from "./store.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
export class PrismaStore implements Store {
  private db = new PrismaClient();

  createUser(u: Parameters<Store["createUser"]>[0]) {
    return this.db.user.create({ data: u as any }) as unknown as Promise<User>;
  }
  findUserByEmail(email: string) { return this.db.user.findUnique({ where: { email } }) as unknown as Promise<User | null>; }
  findUserById(id: string) { return this.db.user.findUnique({ where: { id } }) as unknown as Promise<User | null>; }
  updateUser(id: string, data: Partial<Omit<User, "id">>) {
    return this.db.user.update({ where: { id }, data: data as any }) as unknown as Promise<User>;
  }
  listUsers() { return this.db.user.findMany({ orderBy: { createdAt: "desc" } }) as unknown as Promise<User[]>; }
  addMessage(userId: string, role: Message["role"], content: string) {
    return this.db.message.create({ data: { userId, role, content } }) as unknown as Promise<Message>;
  }
  async recentMessages(userId: string, limit: number) {
    const rows = await this.db.message.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: limit });
    return rows.reverse() as unknown as Message[];
  }
  countUserMessagesSince(userId: string, since: Date) {
    return this.db.message.count({ where: { userId, role: "user", createdAt: { gte: since } } });
  }
  async getWatchlist(userId: string) {
    return (await this.db.watchlistItem.findMany({ where: { userId } })).map((w) => w.symbol);
  }
  async addWatch(userId: string, symbol: string) {
    await this.db.watchlistItem.upsert({
      where: { userId_symbol: { userId, symbol } }, update: {}, create: { userId, symbol },
    });
  }
  async removeWatch(userId: string, symbol: string) {
    await this.db.watchlistItem.deleteMany({ where: { userId, symbol } });
  }
  async recordUsage(userId: string, endpoint: string) {
    await this.db.apiUsage.create({ data: { userId, endpoint } });
  }
  async usageSummary() {
    const rows = await this.db.apiUsage.groupBy({ by: ["endpoint"], _count: { _all: true } });
    return Object.fromEntries(rows.map((r) => [r.endpoint, r._count._all]));
  }
}

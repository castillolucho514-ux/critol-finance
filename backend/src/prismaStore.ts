import { PrismaClient } from "@prisma/client";
import type { Store, User, Role } from "./store";
import type { Plan } from "./plans";

export class PrismaStore implements Store {
  constructor(private db = new PrismaClient()) {}
  createUser(d: { email: string; passwordHash: string; role: Role }) { return this.db.user.create({ data: d }) as Promise<User>; }
  findUserByEmail(email: string) { return this.db.user.findUnique({ where: { email } }) as Promise<User | null>; }
  findUserById(id: string) { return this.db.user.findUnique({ where: { id } }) as Promise<User | null>; }
  listUsers() { return this.db.user.findMany() as Promise<User[]>; }
  async setPlan(id: string, plan: Plan) {
    try { return (await this.db.user.update({ where: { id }, data: { plan } })) as User; } catch { return null; }
  }
  addMessage(userId: string, role: string, content: string) { return this.db.message.create({ data: { userId, role, content } }); }
  async listMessages(userId: string, limit: number) {
    const rows = await this.db.message.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: limit });
    return rows.reverse();
  }
  countUserMessagesSince(userId: string, since: Date) {
    return this.db.message.count({ where: { userId, role: "user", createdAt: { gte: since } } });
  }
}

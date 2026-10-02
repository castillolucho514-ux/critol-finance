import { createApp } from "./app.js";
import { getConfig } from "./config.js";
import { MemoryStore, type Store } from "./database/store.js";

const config = getConfig();
let store: Store;
if (config.databaseUrl) {
  const { PrismaStore } = await import("./database/prismaStore.js");
  store = new PrismaStore();
} else {
  console.warn("DATABASE_URL not set: using in-memory store (data is lost on restart)");
  store = new MemoryStore();
}
createApp(config, store).listen(config.port, () => console.log(`CristoFinance API on :${config.port}`));

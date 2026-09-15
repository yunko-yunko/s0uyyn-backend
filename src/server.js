import { config } from "./config.js";
import { db } from "./db.js";
import { buildApp } from "./app.js";
import { bootstrapAdmin, runMigrations } from "./migrate.js";

let app;

async function shutdown(signal) {
  console.info(`Received ${signal}; shutting down.`);
  await app?.close();
  await db.end();
  process.exit(0);
}

async function start() {
  await runMigrations();
  await bootstrapAdmin();
  app = await buildApp({ database: db });
  await app.listen({ host: config.host, port: config.port });
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));

start().catch(async (error) => {
  console.error("Failed to start API", error);
  await db.end().catch(() => {});
  process.exit(1);
});

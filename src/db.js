import pg from "pg";
import { config } from "./config.js";

const { Pool } = pg;

function poolOptions() {
  const shared = {
    max: config.databasePoolSize,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    application_name: "s0uyyn-home-api"
  };

  if (config.databaseUrl) {
    return {
      ...shared,
      connectionString: config.databaseUrl,
      ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined
    };
  }

  return {
    ...shared,
    host: process.env.PGHOST ?? "127.0.0.1",
    port: Number(process.env.PGPORT ?? 5432),
    database: process.env.PGDATABASE ?? "s0uyyn_home",
    user: process.env.PGUSER ?? "postgres",
    password: process.env.PGPASSWORD,
    ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined
  };
}

export const db = new Pool(poolOptions());

db.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error", error);
});

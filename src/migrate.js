import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { db } from "./db.js";
import { config } from "./config.js";
import { hashPassword } from "./auth.js";

const migrationsDirectory = join(dirname(fileURLToPath(import.meta.url)), "migrations");

export async function runMigrations(database = db) {
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(735001)");
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    const { rows } = await client.query("SELECT name FROM schema_migrations");
    const applied = new Set(rows.map((row) => row.name));
    const filenames = (await readdir(migrationsDirectory)).filter((name) => name.endsWith(".sql")).sort();
    for (const filename of filenames) {
      if (applied.has(filename)) continue;
      const sql = await readFile(join(migrationsDirectory, filename), "utf8");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [filename]);
      console.info(`Applied migration ${filename}`);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function bootstrapAdmin(database = db) {
  if (!config.adminEmail || !config.adminPassword) return false;
  const { rows } = await database.query("SELECT COUNT(*)::INTEGER AS count FROM admin_users");
  if (rows[0].count > 0) return false;
  const result = await database.query(
    "INSERT INTO admin_users (id, email, password_hash) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
    [randomUUID(), config.adminEmail, hashPassword(config.adminPassword)]
  );
  if (result.rowCount > 0) console.info(`Created initial administrator ${config.adminEmail}`);
  return result.rowCount > 0;
}

async function main() {
  await runMigrations();
  await bootstrapAdmin();
  await db.end();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

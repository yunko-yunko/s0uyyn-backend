import "dotenv/config";

function numberFromEnv(name, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const raw = process.env[name];
  const value = raw === undefined ? fallback : Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}.`);
  }
  return value;
}

function booleanFromEnv(name, fallback = false) {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  if (["1", "true", "yes"].includes(raw.toLowerCase())) return true;
  if (["0", "false", "no"].includes(raw.toLowerCase())) return false;
  throw new Error(`${name} must be true or false.`);
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const jwtSecret = process.env.JWT_SECRET ?? "development-only-secret-change-me-now";
const requiredCorsOrigins = [
  "https://s0uyyn-home.yunko20090802.workers.dev",
  "https://s0uyyn.com"
];
const configuredCorsOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

if (nodeEnv === "production" && jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters in production.");
}

export const config = Object.freeze({
  nodeEnv,
  isProduction: nodeEnv === "production",
  host: process.env.HOST ?? "0.0.0.0",
  port: numberFromEnv("PORT", 8080, { min: 1, max: 65535 }),
  databaseUrl: process.env.DATABASE_URL,
  databaseSsl: booleanFromEnv("DATABASE_SSL", false),
  databasePoolSize: numberFromEnv("DATABASE_POOL_SIZE", 10, { min: 1, max: 50 }),
  jwtSecret,
  jwtIssuer: process.env.JWT_ISSUER ?? "s0uyyn-home-api",
  jwtTtlSeconds: numberFromEnv("JWT_TTL_SECONDS", 28_800, { min: 300, max: 86_400 }),
  corsOrigins: [...new Set([...requiredCorsOrigins, ...configuredCorsOrigins])],
  adminEmail: process.env.ADMIN_EMAIL?.trim().toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD
});

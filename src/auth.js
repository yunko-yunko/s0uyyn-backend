import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { config } from "./config.js";

const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;

function encode(value) {
  return Buffer.from(typeof value === "string" ? value : JSON.stringify(value)).toString("base64url");
}

function signature(value) {
  return createHmac("sha256", config.jwtSecret).update(value).digest("base64url");
}

export function hashPassword(password) {
  if (typeof password !== "string" || password.length < 8 || password.length > 200) {
    throw new Error("Password must be between 8 and 200 characters.");
  }
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: 64 * 1024 * 1024
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export function verifyPassword(password, encodedHash) {
  try {
    const [algorithm, n, r, p, saltValue, hashValue] = encodedHash.split("$");
    if (algorithm !== "scrypt") return false;
    const expected = Buffer.from(hashValue, "base64url");
    const actual = scryptSync(password, Buffer.from(saltValue, "base64url"), expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: 64 * 1024 * 1024
    });
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function createAccessToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({
    sub: user.id,
    email: user.email,
    role: "admin",
    iss: config.jwtIssuer,
    iat: now,
    exp: now + config.jwtTtlSeconds
  });
  const unsigned = `${header}.${payload}`;
  return `${unsigned}.${signature(unsigned)}`;
}

export function verifyAccessToken(token) {
  if (typeof token !== "string") throw new Error("Missing access token.");
  const [header, payload, receivedSignature, extra] = token.split(".");
  if (!header || !payload || !receivedSignature || extra) throw new Error("Invalid access token.");
  const expected = signature(`${header}.${payload}`);
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(receivedSignature);
  if (expectedBuffer.length !== receivedBuffer.length || !timingSafeEqual(expectedBuffer, receivedBuffer)) {
    throw new Error("Invalid access token.");
  }
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  const now = Math.floor(Date.now() / 1000);
  if (claims.iss !== config.jwtIssuer || claims.role !== "admin" || !claims.sub || claims.exp <= now) {
    throw new Error("Expired or invalid access token.");
  }
  return claims;
}

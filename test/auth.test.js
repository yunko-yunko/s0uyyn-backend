import test from "node:test";
import assert from "node:assert/strict";
import { createAccessToken, hashPassword, verifyAccessToken, verifyPassword } from "../src/auth.js";

test("password hashes verify without storing the password", () => {
  const hash = hashPassword("a-strong-test-password");
  assert.match(hash, /^scrypt\$/);
  assert.equal(hash.includes("a-strong-test-password"), false);
  assert.equal(verifyPassword("a-strong-test-password", hash), true);
  assert.equal(verifyPassword("the-wrong-password", hash), false);
});

test("access tokens reject tampering", () => {
  const token = createAccessToken({ id: "8afcf8f6-57d0-4bbd-881a-552a2627a556", email: "admin@example.com" });
  const claims = verifyAccessToken(token);
  assert.equal(claims.sub, "8afcf8f6-57d0-4bbd-881a-552a2627a556");
  assert.equal(claims.email, "admin@example.com");
  assert.throws(() => verifyAccessToken(`${token.slice(0, -1)}x`));
});

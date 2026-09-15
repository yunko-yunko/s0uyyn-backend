import test from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app.js";
import { hashPassword } from "../src/auth.js";

const adminId = "8afcf8f6-57d0-4bbd-881a-552a2627a556";

function fakeDatabase() {
  const passwordHash = hashPassword("a-strong-test-password");
  return {
    async query(sql) {
      if (sql.includes("SELECT 1")) return { rows: [{ "?column?": 1 }] };
      if (sql.includes("FROM admin_users WHERE email")) return { rows: [{ id: adminId, email: "admin@example.com", passwordHash, isActive: true }] };
      if (sql.includes("FROM admin_users WHERE id")) return { rows: [{ id: adminId, email: "admin@example.com" }] };
      if (sql.startsWith("UPDATE admin_users")) return { rows: [], rowCount: 1 };
      if (sql.includes("FROM site_settings")) return { rows: [{ organizationName: "협회", englishName: "Association", introEyebrow: "소개", introHeadline: "제목", introBody: "본문", footerDescription: "하단", copyright: "© Test" }] };
      if (sql.includes("FROM recent_cards")) return { rows: [{ id: "1", title: "소식", content: "내용", imageUrl: "https://example.com/news.jpg", position: 1, isActive: true }] };
      if (sql.includes("FROM services")) return { rows: [] };
      if (sql.includes("FROM members")) return { rows: [] };
      if (sql.includes("FROM faqs")) return { rows: [] };
      throw new Error(`Unexpected SQL in test: ${sql}`);
    }
  };
}

test("health and public content routes respond", async () => {
  const app = await buildApp({ database: fakeDatabase(), logger: false });
  const health = await app.inject({ method: "GET", url: "/healthz" });
  assert.equal(health.statusCode, 200);
  assert.deepEqual(health.json(), { status: "ok" });

  const content = await app.inject({ method: "GET", url: "/api/v1/content" });
  assert.equal(content.statusCode, 200);
  assert.equal(content.json().recentCards[0].title, "소식");
  assert.equal(Object.hasOwn(content.json().recentCards[0], "isActive"), false);
  await app.close();
});

test("admin route requires a token and accepts a valid login", async () => {
  const app = await buildApp({ database: fakeDatabase(), logger: false });
  const denied = await app.inject({ method: "GET", url: "/api/v1/admin/me" });
  assert.equal(denied.statusCode, 401);

  const login = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: { email: "admin@example.com", password: "a-strong-test-password" }
  });
  assert.equal(login.statusCode, 200);
  const me = await app.inject({
    method: "GET",
    url: "/api/v1/admin/me",
    headers: { authorization: `Bearer ${login.json().accessToken}` }
  });
  assert.equal(me.statusCode, 200);
  assert.equal(me.json().user.email, "admin@example.com");
  await app.close();
});

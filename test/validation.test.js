import test from "node:test";
import assert from "node:assert/strict";
import { parseEntity, parseLogin, parseSiteSettings, ValidationError } from "../src/validation.js";

test("service input is normalized", () => {
  const service = parseEntity("services", {
    title: " 서비스 ",
    devleoper: ["개발자", "개발자"],
    content: "요약",
    detailContent: "상세",
    hashtags: ["#고래", "바다"],
    imageUrl: "https://example.com/image.png",
    link: "https://example.com",
    position: 2,
    isActive: true
  });
  assert.equal(service.title, "서비스");
  assert.deepEqual(service.devleoper, ["개발자"]);
  assert.deepEqual(service.hashtags, ["고래", "바다"]);
  assert.equal(service.link, "https://example.com/");
});

test("unsafe URLs and unknown fields are rejected", () => {
  assert.throws(() => parseEntity("members", {
    name: "관리자",
    role: "역할",
    imageUrl: "javascript:alert(1)",
    position: 1,
    isActive: true
  }), ValidationError);
  assert.throws(() => parseEntity("faqs", {
    question: "질문",
    answer: "답변",
    position: 1,
    isActive: true,
    unexpected: true
  }), ValidationError);
});

test("site settings require the complete editable document", () => {
  const site = parseSiteSettings({
    organizationName: "협회",
    englishName: "Association",
    introEyebrow: "소개",
    introHeadline: "핵심 문구",
    introBody: "본문",
    footerDescription: "하단 설명",
    copyright: "© Test"
  });
  assert.equal(site.organizationName, "협회");
  assert.throws(() => parseSiteSettings({ organizationName: "협회" }), ValidationError);
});

test("login email is normalized", () => {
  assert.deepEqual(parseLogin({ email: " Admin@Example.COM ", password: "password" }), {
    email: "admin@example.com",
    password: "password"
  });
});

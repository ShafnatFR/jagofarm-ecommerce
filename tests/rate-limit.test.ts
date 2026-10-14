import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import {
  resolveRule,
  consume,
  getClientIp,
  resetRateLimitBuckets,
} from "../src/lib/rate-limit";

beforeEach(() => resetRateLimitBuckets());

test("resolveRule: cocokkan pola route sesuai tabel", () => {
  const auth = resolveRule("/api/auth/register");
  assert.ok(auth, "auth/register harus punya rule");
  assert.equal(auth.rule.windowMs, 60_000);

  const admin = resolveRule("/api/admin/orders");
  assert.ok(admin, "admin harus punya rule");

  assert.equal(resolveRule("/halaman-biasa"), null, "non-API -> null");
});

test("resolveRule: dev melonggarkan limit 10x", () => {
  const env = process.env as Record<string, string | undefined>;
  const prev = env.NODE_ENV;
  try {
    env.NODE_ENV = "production";
    const prod = resolveRule("/api/auth/register");
    env.NODE_ENV = "development";
    const dev = resolveRule("/api/auth/register");
    assert.ok(prod && dev);
    assert.equal(dev.rule.limit, prod.rule.limit * 10, "dev = prod x10");
  } finally {
    if (prev === undefined) delete env.NODE_ENV;
    else env.NODE_ENV = prev;
  }
});

test("consume: izinkan sampai limit, lalu blokir", () => {
  const rule = { limit: 3, windowMs: 60_000 };
  const key = "test-ip:/api/x";

  assert.equal(consume(key, rule).allowed, true);
  assert.equal(consume(key, rule).allowed, true);
  const third = consume(key, rule);
  assert.equal(third.allowed, true);
  assert.equal(third.remaining, 0);

  const fourth = consume(key, rule);
  assert.equal(fourth.allowed, false, "ke-4 harus diblokir");
  assert.ok(fourth.retryAfterSeconds >= 1, "harus ada retry-after");
});

test("consume: key berbeda punya kuota terpisah", () => {
  const rule = { limit: 1, windowMs: 60_000 };
  assert.equal(consume("ip-a:/api/x", rule).allowed, true);
  assert.equal(consume("ip-b:/api/x", rule).allowed, true, "IP lain tidak terpengaruh");
  assert.equal(consume("ip-a:/api/x", rule).allowed, false, "ip-a sudah habis");
});

test("getClientIp: prioritas x-forwarded-for lalu fallback", () => {
  assert.equal(
    getClientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" })),
    "1.2.3.4"
  );
  assert.equal(getClientIp(new Headers({ "x-real-ip": "9.9.9.9" })), "9.9.9.9");
  assert.equal(getClientIp(new Headers({ "cf-connecting-ip": "8.8.8.8" })), "8.8.8.8");
  assert.equal(getClientIp(new Headers()), "unknown");
});

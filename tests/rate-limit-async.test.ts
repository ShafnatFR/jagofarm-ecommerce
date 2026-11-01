import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { consumeAsync } from "../src/lib/rate-limit";

describe("consumeAsync", () => {
  it("tanpa env Upstash = fallback in-memory", async () => {
    const urlPrev = process.env.UPSTASH_REDIS_REST_URL;
    const tokPrev = process.env.UPSTASH_REDIS_REST_TOKEN;
    try {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      const r1 = await consumeAsync("t-fb:/x", { limit: 1, windowMs: 60000 });
      assert.equal(r1.allowed, true);
      const r2 = await consumeAsync("t-fb:/x", { limit: 1, windowMs: 60000 });
      assert.equal(r2.allowed, false);
    } finally {
      if (urlPrev !== undefined) process.env.UPSTASH_REDIS_REST_URL = urlPrev;
      if (tokPrev !== undefined) process.env.UPSTASH_REDIS_REST_TOKEN = tokPrev;
    }
  });
});

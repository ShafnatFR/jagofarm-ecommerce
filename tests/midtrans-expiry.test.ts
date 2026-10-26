import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatMidtransTime } from "../src/lib/midtrans";

describe("formatMidtransTime (expiry.start_time)", () => {
  it("pola yyyy-MM-dd HH:mm:ss +0700", () => {
    const s = formatMidtransTime(new Date("2026-10-26T10:00:00Z"));
    assert.match(s, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \+0700$/);
  });
  it("UTC 10:00 = Jakarta 17:00", () => {
    assert.equal(formatMidtransTime(new Date("2026-10-26T10:00:00Z")), "2026-10-26 17:00:00 +0700");
  });
  it("bukan ISO-8601 (tanpa T/Z)", () => {
    const s = formatMidtransTime(new Date());
    assert.ok(!s.includes("T") && !s.endsWith("Z"));
  });
});

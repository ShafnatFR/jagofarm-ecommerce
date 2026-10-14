import assert from "node:assert/strict";
import { test } from "node:test";
import { formatDate, formatDateTime, generateOrderNumber, APP_TIME_ZONE } from "../src/lib/utils";

test("APP_TIME_ZONE = Asia/Jakarta", () => {
  assert.equal(APP_TIME_ZONE, "Asia/Jakarta");
});

test("formatDate: memakai WIB (bukan UTC) — 31 Des 23:30 UTC = 1 Jan WIB", () => {
  // 2025-12-31T23:30:00Z => WIB 2026-01-01T06:30
  const d = new Date("2025-12-31T23:30:00Z");
  const out = formatDate(d);
  assert.match(out, /1 Januari 2026/, `dapat: ${out}`);
});

test("formatDateTime: menyertakan jam WIB", () => {
  const d = new Date("2025-12-31T23:30:00Z");
  const out = formatDateTime(d);
  assert.match(out, /2026/);
  assert.match(out, /06[.:]30/); // 23:30 UTC + 7 = 06:30 WIB
});

test("generateOrderNumber: format JF-YYMMDD-XXXX (tanggal WIB)", () => {
  const n = generateOrderNumber();
  assert.match(n, /^JF-\d{6}-[0-9A-F]{4}$/);
  // Bagian tanggal harus sama dengan tanggal WIB hari ini.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const expected = `${get("year")}${get("month")}${get("day")}`;
  assert.ok(n.includes(expected), `nomor ${n} harus memuat tanggal WIB ${expected}`);
});

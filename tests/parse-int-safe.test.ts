import assert from "node:assert/strict";
import { test } from "node:test";
import { parseIntSafe } from "../src/lib/utils";

/**
 * Input query publik (?limit=, ?period=, ?min_price=) diteruskan ke Prisma.
 * parseInt("abc") = NaN -> Prisma menolak Decimal -> 500 Internal Server Error.
 * parseIntSafe adalah guard yang dipakai di seluruh route pagination.
 */

test("parseIntSafe: angka valid dipakai apa adanya", () => {
  assert.equal(parseIntSafe("12", 1, 1, 50), 12);
  assert.equal(parseIntSafe("50", 1, 1, 50), 50);
  assert.equal(parseIntSafe("0", 1, 1, 50), 1, "dibawah min dinaikkan");
  assert.equal(parseIntSafe("999", 1, 1, 50), 50, "diatas max diturunkan");
});

test("parseIntSafe: nilai tak valid -> fallback (bukan NaN)", () => {
  assert.equal(parseIntSafe("abc", 12, 1, 50), 12, "bukan angka -> fallback");
  assert.equal(parseIntSafe("", 12, 1, 50), 12, "string kosong -> fallback");
  assert.equal(parseIntSafe(null, 12, 1, 50), 12, "null -> fallback");
  assert.equal(parseIntSafe(undefined, 12, 1, 50), 12, "undefined -> fallback");
  assert.equal(parseIntSafe("12abc", 12, 1, 50), 12, "campuran -> fallback");
  assert.equal(parseIntSafe("-5", 12, 1, 50), 1, "negatif -> clamp ke min");
  assert.equal(parseIntSafe("3.7", 12, 1, 50), 3, "desimal -> dipotong");
  assert.equal(parseIntSafe("Infinity", 12, 1, 50), 12, "Infinity -> fallback");
});

test("parseIntSafe: hasil tak pernah NaN (aman untuk Prisma)", () => {
  for (const raw of ["abc", "", null, undefined, "NaN", "1e999", "-0"]) {
    const got = parseIntSafe(raw as string | null | undefined, 10, 1, 50);
    assert.ok(Number.isFinite(got), `${String(raw)} -> ${got} harus finite`);
  }
});

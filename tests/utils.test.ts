import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatPrice,
  generateOrderNumber,
  slugify,
  truncate,
  calcDiscountPercent,
  getEffectivePrice,
} from "../src/lib/utils";

test("formatPrice: format Rupiah Indonesia tanpa desimal", () => {
  assert.match(formatPrice(0), /0/);
  assert.match(formatPrice(1_000), /1\.000/);
  assert.match(formatPrice(1_000_000), /1\.000\.000/);
  // Menerima string & objek Decimal-like
  assert.match(formatPrice("25000"), /25\.000/);
  assert.match(formatPrice({ toString: () => "1500" }), /1\.500/);
});

test("formatPrice: nilai tak valid tidak menghasilkan 'RpNaN'", () => {
  assert.doesNotMatch(formatPrice(NaN), /NaN/);
  assert.doesNotMatch(formatPrice("abc"), /NaN/);
  assert.doesNotMatch(formatPrice({ toString: () => "bukan angka" }), /NaN/);
  assert.match(formatPrice(NaN), /0/);
});

test("generateOrderNumber: format JF-YYMMDD-XXXX & unik", () => {
  const n = generateOrderNumber();
  assert.match(n, /^JF-\d{6}-[0-9A-F]{4}$/, `format salah: ${n}`);

  const set = new Set<string>();
  for (let i = 0; i < 100; i++) set.add(generateOrderNumber());
  assert.ok(set.size > 90, "harus unik hampir selalu (>=90/100)");
});

test("slugify: lowercase, spasi->dash, simbol dibuang", () => {
  assert.equal(slugify("Hello World"), "hello-world");
  assert.equal(slugify("  Paket  Tambak  "), "paket-tambak");
  assert.equal(slugify("Bibit Jagung (Hibrida)!"), "bibit-jagung-hibrida");
  assert.equal(slugify("---a---b---"), "a-b");
  assert.equal(slugify("Multi   Space"), "multi-space");
});

test("truncate: potong + elipsis, tidak potong bila pendek", () => {
  assert.equal(truncate("abcdef", 10), "abcdef");
  assert.equal(truncate("abcdefghij", 5), "abcde…");
  // trimEnd sebelum elipsis
  assert.equal(truncate("abc   def", 4), "abc…");
});

test("calcDiscountPercent: hitung persen diskon", () => {
  assert.equal(calcDiscountPercent(100_000, 75_000), 25);
  assert.equal(calcDiscountPercent(100_000, 100_000), 0);
  assert.equal(calcDiscountPercent(50_000, 0), 100);
  assert.equal(calcDiscountPercent(0, 10_000), 0, "base 0 -> 0");
});

test("getEffectivePrice: pakai diskon bila valid, kalau tidak base", () => {
  assert.equal(getEffectivePrice(100_000, 80_000), 80_000);
  assert.equal(getEffectivePrice(100_000, null), 100_000);
  assert.equal(getEffectivePrice(100_000, 0), 100_000, "diskon 0 -> base");
  assert.equal(getEffectivePrice(100_000, 120_000), 100_000, "diskon > base -> base");
  assert.equal(getEffectivePrice("50000", "40000"), 40_000);
});

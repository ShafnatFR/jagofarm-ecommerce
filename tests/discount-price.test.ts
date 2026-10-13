import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calcDiscountPercent,
  generateOrderNumber,
  getEffectivePrice,
} from "../src/lib/utils";

test("calcDiscountPercent menghitung persentase diskon dan membulatkan", () => {
  assert.equal(calcDiscountPercent(100000, 75000), 25);
  assert.equal(calcDiscountPercent(1000, 333), 67);
  assert.equal(calcDiscountPercent(80000, 60000), 25);
});

test("calcDiscountPercent menerima harga bertipe string (Prisma Decimal)", () => {
  assert.equal(calcDiscountPercent("100000", "75000"), 25);
  assert.equal(calcDiscountPercent("120000", 109000), 9);
});

test("calcDiscountPercent mengembalikan 0 tanpa diskon atau harga dasar tidak valid", () => {
  assert.equal(calcDiscountPercent(100000, 100000), 0);
  assert.equal(calcDiscountPercent(0, 0), 0);
  assert.equal(calcDiscountPercent(-50000, 10000), 0);
});

test("getEffectivePrice memakai harga diskon hanya bila lebih murah dan positif", () => {
  assert.equal(getEffectivePrice(100000, 75000), 75000);
  assert.equal(getEffectivePrice("100000", "75000"), 75000);
  // Diskon tidak lebih murah -> harga dasar.
  assert.equal(getEffectivePrice(100000, 150000), 100000);
  assert.equal(getEffectivePrice(100000, 100000), 100000);
  // Dison 0/negatif dianggap "tidak ada diskon".
  assert.equal(getEffectivePrice(100000, 0), 100000);
  assert.equal(getEffectivePrice(100000, -1000), 100000);
});

test("getEffectivePrice mengembalikan harga dasar saat tidak ada diskon", () => {
  assert.equal(getEffectivePrice(100000), 100000);
  assert.equal(getEffectivePrice(100000, null), 100000);
  assert.equal(getEffectivePrice(100000, undefined), 100000);
  assert.equal(getEffectivePrice("100000"), 100000);
});

test("generateOrderNumber memakai format JF-YYMMDD-XXXX (hex kapital)", () => {
  const now = new Date();
  const expectedPrefix = `JF-${String(now.getFullYear()).slice(-2)}${String(
    now.getMonth() + 1
  ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

  const orderNumber = generateOrderNumber();
  assert.match(orderNumber, /^JF-\d{6}-[0-9A-F]{4}$/);
  assert.ok(orderNumber.startsWith(`${expectedPrefix}-`), `${orderNumber} harus berawalan ${expectedPrefix}-`);
});

test("generateOrderNumber menghasilkan nilai acak di bagian akhir", () => {
  const first = generateOrderNumber();
  const second = generateOrderNumber();
  assert.notEqual(first, second);
});

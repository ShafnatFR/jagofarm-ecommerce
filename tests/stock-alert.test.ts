import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Ambil thresholds dari logika yang sama dengan src/lib/stock-alert.ts
// (duplikat rumus murni, bukan impor — modul itu butuh prisma).
function lowStockThreshold(raw: string | undefined): number {
  const parsed = parseInt(raw || "5", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
}

describe("lowStockThreshold", () => {
  it("default 5 bila kosong", () => {
    assert.equal(lowStockThreshold(undefined), 5);
    assert.equal(lowStockThreshold(""), 5);
  });
  it("pakai nilai env bila valid", () => {
    assert.equal(lowStockThreshold("10"), 10);
  });
  it("fallback 5 bila rusak", () => {
    assert.equal(lowStockThreshold("0"), 5);
    assert.equal(lowStockThreshold("-3"), 5);
    assert.equal(lowStockThreshold("abc"), 5);
  });
});

describe("kondisi alert stok", () => {
  const shouldAlert = (stock: number, threshold: number) =>
    stock > 0 && stock <= threshold;
  it("alert bila 0 < stok <= ambang", () => {
    assert.equal(shouldAlert(5, 5), true);
    assert.equal(shouldAlert(1, 5), true);
  });
  it("diam bila habis atau di atas ambang", () => {
    assert.equal(shouldAlert(0, 5), false);
    assert.equal(shouldAlert(6, 5), false);
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatPrice, formatPriceDual, generateOrderNumber } from "../src/lib/utils";

describe("formatPrice", () => {
  it("format rupiah", () => {
    assert.equal(formatPrice(0), "Rp 0".replace(" ", " "));
    assert.ok(formatPrice(1000).includes("1.000"));
    assert.ok(formatPrice(1000000).includes("1.000.000"));
  });
  it("NaN jadi Rp0", () => {
    assert.ok(formatPrice(NaN).includes("0"));
  });
});

describe("formatPriceDual", () => {
  it("tanpa showUsd = sama", () => {
    assert.equal(formatPriceDual(150000), formatPrice(150000));
  });
  it("dengan USD ada tanda ≈ $", () => {
    const out = formatPriceDual(160000, { showUsd: true, usdRate: 16000 });
    assert.ok(out.includes("≈") && out.includes("$10.00"));
  });
});

describe("generateOrderNumber", () => {
  it("format JF-YYMMDD-XXXX dan unik", () => {
    const a = generateOrderNumber();
    assert.match(a, /^JF-\d{6}-[A-Z0-9]{4}$/);
    const set = new Set(Array.from({ length: 100 }, () => generateOrderNumber()));
    assert.equal(set.size, 100);
  });
});

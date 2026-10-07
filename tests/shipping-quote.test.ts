import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calculateChargeableWeight,
  validateSelectedShippingOption,
  type ShippingQuoteItem,
  type LiveShippingOption,
} from "../src/lib/shipping-quote";

const item = (overrides: Partial<ShippingQuoteItem> = {}): ShippingQuoteItem => ({
  quantity: 1,
  weightGram: 1000,
  lengthCm: 20,
  widthCm: 20,
  heightCm: 10,
  ...overrides,
});

test("uses the greater of actual and volumetric weight", () => {
  assert.deepEqual(calculateChargeableWeight([item()]), {
    actualWeightGram: 1000,
    volumetricWeightGram: 800,
    chargeableWeightGram: 1000,
    divisor: 5000,
  });

  assert.equal(
    calculateChargeableWeight([item({ weightGram: 100 })]).chargeableWeightGram,
    800
  );
});

test("scales actual and volumetric weight by quantity and rounds up", () => {
  const result = calculateChargeableWeight(
    [item({ quantity: 2, weightGram: 123, lengthCm: 33, widthCm: 20, heightCm: 10 })],
    4000
  );
  assert.equal(result.actualWeightGram, 246);
  assert.equal(result.volumetricWeightGram, 3300);
  assert.equal(result.chargeableWeightGram, 3300);
  assert.equal(result.divisor, 4000);
});

test("validates a selected courier and service against a live quote", () => {
  const options: LiveShippingOption[] = [
    { courier: "jne", courierName: "JNE", service: "REG", cost: 18000, etd: "2-3" },
  ];
  assert.deepEqual(validateSelectedShippingOption(options, "JNE", "REG"), options[0]);
  assert.throws(
    () => validateSelectedShippingOption(options, "jne", "YES"),
    /layanan pengiriman/i
  );
  assert.throws(
    () => validateSelectedShippingOption(options, "test", "Gratis Testing"),
    /kurir pengiriman/i
  );
});

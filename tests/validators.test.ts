import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { registerSchema, checkoutSchema, reviewSchema } from "../src/lib/validators";

describe("registerSchema", () => {
  const valid = {
    name: "Budi",
    email: "a@b.id",
    password: "Abcdef12",
    confirmPassword: "Abcdef12",
  };
  it("valid lolos", () => {
    assert.ok(registerSchema.safeParse(valid).success);
  });
  it("password pendek ditolak", () => {
    assert.ok(!registerSchema.safeParse({ ...valid, password: "Ab1", confirmPassword: "Ab1" }).success);
  });
  it("tanpa huruf besar/angka ditolak", () => {
    assert.ok(!registerSchema.safeParse({ ...valid, password: "abcdefgh", confirmPassword: "abcdefgh" }).success);
  });
  it("konfirmasi beda ditolak", () => {
    assert.ok(!registerSchema.safeParse({ ...valid, confirmPassword: "Xyz12345" }).success);
  });
  it("email rusak ditolak", () => {
    assert.ok(!registerSchema.safeParse({ ...valid, email: "bukan-email" }).success);
  });
});

describe("reviewSchema", () => {
  it("rating di luar 1-5 ditolak", () => {
    assert.ok(!reviewSchema.safeParse({ productId: "x", rating: 6, comment: "cukup panjang untuk lolos minimal" }).success);
  });
});

describe("checkoutSchema", () => {
  it("butuh addressId dan items", () => {
    assert.ok(!checkoutSchema.safeParse({}).success);
  });
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";
import { addressSchema } from "../src/lib/validators";

/**
 * Regresi ditemukan lewat audit: addressSchema di lib/validators.ts memakai
 * min(5).max(5) yang MENGHITUNG KARAKTER, bukan angka — sehingga "abcde"
 * lolos sebagai kode pos. Route sebenarnya sudah memakai /^[0-9]{5}$/.
 * Skema ini tetap diuji agar tidak kembali meloloskan input cacat.
 */

const validAddress = {
  label: "Rumah",
  recipientName: "Budi Santoso",
  phone: "081234567890",
  province: "Jawa Barat",
  city: "Bandung",
  district: "Coblong",
  postalCode: "40111",
  detail: "Jl. Cikutra Barat No. 12",
  isDefault: true,
};

test("addressSchema: alamat valid diterima", () => {
  const r = addressSchema.safeParse(validAddress);
  assert.equal(r.success, true, JSON.stringify(!r.success && r.error.flatten()));
});

test("addressSchema: kode pos harus 5 ANGKA (bukan 5 karakter)", () => {
  for (const bad of ["abcde", "1234a", "4011", "401111", "", "401 1"]) {
    const r = addressSchema.safeParse({ ...validAddress, postalCode: bad });
    assert.equal(r.success, false, `postalCode "${bad}" seharusnya ditolak`);
  }
});

test("addressSchema: telepon harus 10-20 digit", () => {
  for (const bad of ["08123", "08123456789012345678901"]) {
    const r = addressSchema.safeParse({ ...validAddress, phone: bad });
    assert.equal(r.success, false, `phone "${bad}" seharusnya ditolak`);
  }
});

test("addressSchema: nama penerima minimal 2 karakter", () => {
  const r = addressSchema.safeParse({ ...validAddress, recipientName: "B" });
  assert.equal(r.success, false, "satu karakter seharusnya ditolak");
});

test("skema route (kanonik) & validators menolak kode pos non-angka", () => {
  // Skema route ada di dalam file route; tiru definisinya di sini agar tes
  // tetap menangkap pola min/max-vs-regex bila ada yang menyalin ulang.
  const routeLike = z.object({
    postalCode: z.string().regex(/^[0-9]{5}$/, "Kode pos harus 5 digit angka"),
  });
  assert.equal(routeLike.safeParse({ postalCode: "abcde" }).success, false);
  assert.equal(routeLike.safeParse({ postalCode: "40111" }).success, true);
});

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  normalizeStoreProfile,
  STORE_PROFILE_DEFAULT,
} from "../src/lib/site-settings-shared";

test("normalizeStoreProfile menolak input bukan objek", () => {
  assert.equal(normalizeStoreProfile(null), null);
  assert.equal(normalizeStoreProfile("string"), null);
  assert.equal(normalizeStoreProfile(42), null);
  assert.equal(normalizeStoreProfile([{ name: "Toko" }]), null);
});

test("normalizeStoreProfile mengisi semua default untuk objek kosong", () => {
  assert.deepEqual(normalizeStoreProfile({}), STORE_PROFILE_DEFAULT);
});

test("normalizeStoreProfile mempertahankan nilai valid (dengan trim)", () => {
  const profile = normalizeStoreProfile({
    name: "  JagoFarm Agro  ",
    tagline: "Pertanian Terukur",
    email: " cs@jagofarm.id ",
    phone: "0852-1537-6975",
    whatsapp: "6285215376975",
    address: "Bandung",
    hours: "Senin - Jumat: 08:00 - 17:00 WIB",
    hoursShort: "08.00 - 17.00",
    instagram: "https://www.instagram.com/jagofarmstartup",
    website: "https://jagofarm.dev/",
    mapsUrl: "https://www.google.com/maps/embed?pb=contoh",
  });

  assert.ok(profile);
  assert.equal(profile.name, "JagoFarm Agro");
  assert.equal(profile.tagline, "Pertanian Terukur");
  assert.equal(profile.email, "cs@jagofarm.id");
  assert.equal(profile.whatsapp, "6285215376975");
  assert.equal(profile.instagram, "https://www.instagram.com/jagofarmstartup");
  assert.equal(profile.website, "https://jagofarm.dev/");
});

test("normalizeStoreProfile memakai default per field saat nilai tidak valid", () => {
  const profile = normalizeStoreProfile({
    name: "x".repeat(101),
    tagline: "",
    email: 123,
    hours: { bukan: "string" },
  });

  assert.ok(profile);
  assert.equal(profile.name, STORE_PROFILE_DEFAULT.name);
  assert.equal(profile.tagline, STORE_PROFILE_DEFAULT.tagline);
  assert.equal(profile.email, STORE_PROFILE_DEFAULT.email);
  assert.equal(profile.hours, STORE_PROFILE_DEFAULT.hours);
});

test("normalizeStoreProfile menyanitasi nomor WhatsApp jadi digit saja", () => {
  const profile = normalizeStoreProfile({
    whatsapp: " +62 852-1537-6975 ",
  });
  assert.ok(profile);
  assert.equal(profile.whatsapp, "6285215376975");

  const local = normalizeStoreProfile({ whatsapp: "0812-3456-7890" });
  assert.ok(local);
  assert.equal(local.whatsapp, "081234567890");
});

test("normalizeStoreProfile mengembalikan WhatsApp default bila digit tidak wajar", () => {
  const tooShort = normalizeStoreProfile({ whatsapp: "12345" });
  assert.ok(tooShort);
  assert.equal(tooShort.whatsapp, STORE_PROFILE_DEFAULT.whatsapp);

  const tooLong = normalizeStoreProfile({ whatsapp: "1".repeat(21) });
  assert.ok(tooLong);
  assert.equal(tooLong.whatsapp, STORE_PROFILE_DEFAULT.whatsapp);

  const invalid = normalizeStoreProfile({ whatsapp: "tidak-ada-angka" });
  assert.ok(invalid);
  assert.equal(invalid.whatsapp, STORE_PROFILE_DEFAULT.whatsapp);
});

test("normalizeStoreProfile hanya menerima email sederhana yang valid", () => {
  const valid = normalizeStoreProfile({ email: "halo@jagofarm.co.id" });
  assert.ok(valid);
  assert.equal(valid.email, "halo@jagofarm.co.id");

  for (const bad of ["bukan-email", "tanpa@domain", "dua@@at.id", "spasi @jagofarm.id"]) {
    const profile = normalizeStoreProfile({ email: bad });
    assert.ok(profile);
    assert.equal(profile.email, STORE_PROFILE_DEFAULT.email, `${bad} harus jatuh ke default`);
  }
});

test("normalizeStoreProfile hanya menerima URL http(s)", () => {
  const profile = normalizeStoreProfile({
    instagram: "javascript:alert(1)",
    website: "HTTPS://JAGOFARM.DEV/",
    mapsUrl: "/embed/peta",
  });

  assert.ok(profile);
  assert.equal(profile.instagram, STORE_PROFILE_DEFAULT.instagram);
  assert.equal(profile.mapsUrl, STORE_PROFILE_DEFAULT.mapsUrl);
  assert.equal(profile.website, "HTTPS://JAGOFARM.DEV/");

  const http = normalizeStoreProfile({ website: "http://localhost:3000" });
  assert.ok(http);
  assert.equal(http.website, "http://localhost:3000");
});

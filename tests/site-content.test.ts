import assert from "node:assert/strict";
import { test } from "node:test";
import {
  normalizeSiteContent,
  SITE_CONTENT_DEFAULT,
} from "../src/lib/site-settings-shared";

test("normalizeSiteContent menolak input bukan objek", () => {
  assert.equal(normalizeSiteContent(null), null);
  assert.equal(normalizeSiteContent("string"), null);
  assert.equal(normalizeSiteContent(42), null);
  assert.equal(normalizeSiteContent([{ navPromo: "x" }]), null);
});

test("normalizeSiteContent mengisi semua default untuk objek kosong", () => {
  assert.deepEqual(normalizeSiteContent({}), SITE_CONTENT_DEFAULT);
});

test("normalizeSiteContent mempertahankan nilai valid (dengan trim)", () => {
  const content = normalizeSiteContent({
    navPromo: "  Promo Spesial  ",
    navBrandTagline: "Agri Tech",
    authHeadline: "Judul Baru",
  });

  assert.ok(content);
  assert.equal(content.navPromo, "Promo Spesial");
  assert.equal(content.navBrandTagline, "Agri Tech");
  assert.equal(content.authHeadline, "Judul Baru");
  // Field yang tidak diisi tetap default.
  assert.equal(content.contactFaqTitle, SITE_CONTENT_DEFAULT.contactFaqTitle);
});

test("normalizeSiteContent memakai default per field saat nilai tidak valid", () => {
  const content = normalizeSiteContent({
    navPromo: "",
    navBrandTagline: 123,
    authHeadline: "x".repeat(501),
    authSubtitle: { bukan: "string" },
  });

  assert.ok(content);
  assert.equal(content.navPromo, SITE_CONTENT_DEFAULT.navPromo);
  assert.equal(content.navBrandTagline, SITE_CONTENT_DEFAULT.navBrandTagline);
  assert.equal(content.authHeadline, SITE_CONTENT_DEFAULT.authHeadline);
  assert.equal(content.authSubtitle, SITE_CONTENT_DEFAULT.authSubtitle);
});

test("normalizeSiteContent mengembalikan semua field yang diharapkan", () => {
  const content = normalizeSiteContent({});
  assert.ok(content);
  for (const key of Object.keys(SITE_CONTENT_DEFAULT)) {
    assert.equal(
      typeof content[key as keyof typeof content],
      "string",
      `${key} harus string`
    );
  }
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeHtml } from "../src/lib/sanitize";
import { normalizeHero, HOME_HERO_DEFAULT } from "../src/lib/site-settings-shared";

test("sanitizeHtml membuang script dan handler event, mempertahankan markup", () => {
  const dirty =
    `<h2 class="x">Judul</h2><script>alert(1)</script>` +
    `<p onmouseover="hack()">teks</p><img src=x onerror=alert(2)>` +
    `<a href="https://contoh.id">tautan</a>`;
  const clean = sanitizeHtml(dirty);

  assert.ok(!clean.includes("script"), "tag script harus dibuang");
  assert.ok(!clean.includes("onerror"), "attribute onerror harus dibuang");
  assert.ok(!clean.includes("onmouseover"), "attribute onmouseover harus dibuang");
  assert.ok(clean.includes("<h2"), "markup heading dipertahankan");
  assert.ok(clean.includes("Judul"), "teks konten dipertahankan");
  assert.ok(clean.includes("contoh.id"), "tautan https dipertahankan");
});

test("normalizeHero menjatuhkan href skema berbahaya ke default", () => {
  const hero = normalizeHero({
    eyebrow: "Promo",
    headline: "Judul Baru",
    headlineHighlight: "Hemat 20%",
    subtitle: "Sub",
    primaryCtaLabel: "Beli",
    primaryCtaHref: "javascript:alert(1)",
    secondaryCtaLabel: "Chat",
    secondaryCtaHref: "/contact",
  });

  assert.ok(hero);
  assert.equal(hero.eyebrow, "Promo");
  assert.equal(hero.primaryCtaHref, HOME_HERO_DEFAULT.primaryCtaHref);
  assert.equal(hero.secondaryCtaHref, "/contact");
});

test("normalizeHero mengisi field kosong dengan default", () => {
  const hero = normalizeHero({ headline: "" });
  assert.ok(hero);
  assert.equal(hero.headline, HOME_HERO_DEFAULT.headline);
});

test("normalizeHero menolak input bukan objek", () => {
  assert.equal(normalizeHero(null), null);
  assert.equal(normalizeHero("string"), null);
});

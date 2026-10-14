import assert from "node:assert/strict";
import { test } from "node:test";
import { sanitizeHtml } from "../src/lib/sanitize";

test("sanitizeHtml: membuang <script> (stored XSS)", () => {
  const dirty = `<p>Halo</p><script>alert('xss')</script>`;
  const clean = sanitizeHtml(dirty);
  assert.doesNotMatch(clean, /<script/i);
  assert.doesNotMatch(clean, /alert\(/);
  assert.match(clean, /Halo/);
});

test("sanitizeHtml: membuang event handler on* (onerror/onclick)", () => {
  const dirty = `<img src="x" onerror="alert(1)"><a href="#" onclick="evil()">klik</a>`;
  const clean = sanitizeHtml(dirty);
  assert.doesNotMatch(clean, /onerror/i);
  assert.doesNotMatch(clean, /onclick/i);
  assert.doesNotMatch(clean, /evil\(/);
});

test("sanitizeHtml: membuang javascript: URL", () => {
  const dirty = `<a href="javascript:alert(1)">x</a>`;
  const clean = sanitizeHtml(dirty);
  assert.doesNotMatch(clean, /javascript:/i);
});

test("sanitizeHtml: mempertahankan markup aman (h2, p, ul, a target)", () => {
  const safe = `<h2>Judul</h2><p>Teks <strong>tebal</strong></p><ul><li>a</li></ul><a href="/faq" target="_blank">tautan</a>`;
  const clean = sanitizeHtml(safe);
  assert.match(clean, /<h2>Judul<\/h2>/);
  assert.match(clean, /<strong>tebal<\/strong>/);
  assert.match(clean, /<ul>/);
  assert.match(clean, /target="_blank"/);
});

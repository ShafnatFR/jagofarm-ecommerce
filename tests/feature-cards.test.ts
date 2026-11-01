import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Cerminkan parseFeatureCards di product-detail-view.tsx
function parseFeatureCards(raw: string | undefined) {
  const fallback = [{ title: "F", desc: "D" }];
  if (!raw) return fallback;
  const cards = raw
    .split("|")
    .map((part) => {
      const [title, ...rest] = part.split("~");
      return { title: (title ?? "").trim(), desc: rest.join("~").trim() };
    })
    .filter((c) => c.title && c.desc);
  return cards.length > 0 ? cards.slice(0, 6) : fallback;
}

describe("parseFeatureCards", () => {
  it("fallback bila kosong", () => {
    assert.equal(parseFeatureCards(undefined).length, 1);
    assert.equal(parseFeatureCards("").length, 1);
  });
  it("parse 2 kartu", () => {
    const out = parseFeatureCards("A~a|B~b");
    assert.equal(out.length, 2);
    assert.equal(out[0].title, "A");
    assert.equal(out[1].desc, "b");
  });
  it("buang kartu rusak, fallback bila semua rusak", () => {
    assert.equal(parseFeatureCards("A~a|rusak").length, 1);
    assert.equal(parseFeatureCards("rusak|juga").length, 1);
  });
  it("batasi 6 kartu", () => {
    const raw = Array.from({ length: 8 }, (_, i) => `T${i}~D${i}`).join("|");
    assert.equal(parseFeatureCards(raw).length, 6);
  });
});

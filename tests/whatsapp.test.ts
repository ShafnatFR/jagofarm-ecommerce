import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizePhone, isWhatsAppConfigured, isWhatsAppDisabled } from "../src/lib/whatsapp";

describe("whatsapp", () => {
  it("normalisasi 08xx -> 62xx", () => {
    assert.equal(normalizePhone("085215376975"), "6285215376975");
    assert.equal(normalizePhone("+6285215376975"), "6285215376975");
    assert.equal(normalizePhone("6285215376975"), "6285215376975");
  });
  it("nomor rusak -> null", () => {
    assert.equal(normalizePhone("abc"), null);
    assert.equal(normalizePhone(""), null);
  });
  it("tanpa env = tidak dikonfigurasi", () => {
    const prev = process.env.WHATSAPP_API_TOKEN;
    try {
      delete process.env.WHATSAPP_API_TOKEN;
      assert.equal(isWhatsAppConfigured(), false);
    } finally {
      if (prev !== undefined) process.env.WHATSAPP_API_TOKEN = prev;
    }
    assert.equal(typeof isWhatsAppDisabled(), "boolean");
  });
});

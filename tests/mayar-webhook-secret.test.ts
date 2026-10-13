import assert from "node:assert/strict";
import { before, test } from "node:test";

// MAYAR_WEBHOOK_SECRET dibaca pada setiap pemanggilan (bukan saat import),
// tapi env tetap diatur lebih dulu supaya tes tidak bergantung pada nilai shell.
const SECRET = "e2e-secret";

type SecretMatcher = (candidate: string) => boolean;
type SecretReader = () => string;

let mayarSecretMatches: SecretMatcher;
let getMayarWebhookSecret: SecretReader;

before(async () => {
  process.env.MAYAR_WEBHOOK_SECRET = SECRET;
  ({ mayarSecretMatches, getMayarWebhookSecret } = (await import(
    "../src/lib/payments/mayar"
  )) as { mayarSecretMatches: SecretMatcher; getMayarWebhookSecret: SecretReader });
});

test("mayarSecretMatches menerima secret yang sama", () => {
  assert.equal(mayarSecretMatches(SECRET), true);
});

test("mayarSecretMatches menolak secret yang berbeda", () => {
  assert.equal(mayarSecretMatches("e2e-secrets"), false);
  assert.equal(mayarSecretMatches("E2E-SECRET"), false);
  assert.equal(mayarSecretMatches(" e2e-secret"), false);
  assert.equal(mayarSecretMatches(""), false);
});

test("mayarSecretMatches menolak kandidat dengan panjang berbeda", () => {
  // Hash keduanya lebih dulu, jadi perbandingan tidak melempar error panjang
  // dan tidak membocorkan panjang secret lewat waktu eksekusi.
  assert.equal(mayarSecretMatches(SECRET + "0"), false);
  assert.equal(mayarSecretMatches(SECRET.slice(0, -1)), false);
});

test("getMayarWebhookSecret menolak value kosong dan memangkas spasi", () => {
  const original = process.env.MAYAR_WEBHOOK_SECRET;
  try {
    process.env.MAYAR_WEBHOOK_SECRET = "  " + SECRET + "  ";
    assert.equal(getMayarWebhookSecret(), SECRET);

    process.env.MAYAR_WEBHOOK_SECRET = "   ";
    assert.equal(getMayarWebhookSecret(), "");
  } finally {
    if (original === undefined) delete process.env.MAYAR_WEBHOOK_SECRET;
    else process.env.MAYAR_WEBHOOK_SECRET = original;
  }
});

test("mayarSecretMatches selalu false kalau secret belum dikonfigurasi", () => {
  const original = process.env.MAYAR_WEBHOOK_SECRET;
  try {
    delete process.env.MAYAR_WEBHOOK_SECRET;
    assert.equal(mayarSecretMatches(""), false);
    assert.equal(mayarSecretMatches("nilai-apa-pun"), false);
  } finally {
    if (original === undefined) delete process.env.MAYAR_WEBHOOK_SECRET;
    else process.env.MAYAR_WEBHOOK_SECRET = original;
  }
});

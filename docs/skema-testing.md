# Skema Testing JagoFarm E-Commerce

> Rancangan uji berlapis agar **orchestrator (Hermes) & subagent** bisa menjalankan
> verifikasi mandiri, cepat, dan dapat diulang.
> Dibuat: 2026-10-14 · Stack: Next.js 16 + Prisma 5 + Supabase + Mayar/RajaOngkir.

---

## Prinsip

1. **Lapis cepat dulu** — L1 (unit, tanpa DB) < 5 detik, jalan tiap perubahan.
2. **Satu perintah per lapis** — tiap lapis punya satu entry point yang bisa dipanggil subagent.
3. **Deterministik** — tak bergantung jaringan/DB untuk L1–L2.
4. **Bukti, bukan klaim** — tiap lapis cetak `PASS/FAIL` + exit code.
5. **Bersih setelah uji** — data uji dihapus/dikembalikan (pola `scripts/e2e-mayar-flow.ts`).

---

## 4 Lapis

| Lapis | Nama | Butuh | Durasi | Dijalankan oleh |
|---|---|---|---|---|
| **L1** | Unit (fungsi murni) | tak ada | < 5s | siapa pun, tiap perubahan |
| **L2** | Integrasi API (mock) | dev server + mock | < 30s | subagent, sebelum deploy |
| **L3** | E2E alur kritis | dev server + DB | < 2m | orchestrator, sebelum rilis |
| **L4** | Smoke produksi | URL live | < 30s | orchestrator, pasca-deploy |

---

## L1 — Unit Test (fungsi murni, tanpa DB)

**Runner:** `tsx --test` (Node built-in). **Lokasi:** `tests/*.test.ts`.

### Sudah ada (7 file, 37 test)
`discount-price` · `mayar-webhook-secret` · `midtrans-signature` ·
`shipping-quote` · `site-settings` · `store-profile` · `site-content`

### Target tambahan (fungsi murni yang belum diuji)
| Modul | Fungsi | Kasus uji |
|---|---|---|
| `loyalty.ts` | `pointsForAmount(amount)` | 0 → 0 · 9.999 → 0 · 10.000 → 1 · 25.000 → 2 · negatif → 0 |
| `loyalty.ts` | `earnPerAmount/referralOwnerPoints/referralRefereePoints` | baca env + default |
| `utils.ts` | `formatPrice` | 0, 1.000, 1.000.000, desimal |
| `utils.ts` | `generateOrderNumber()` | format `JF-YYMMDD-XXXX`, unik 100x |
| `utils.ts` | `slugify` | spasi→dash, huruf besar→kecil, simbol dibuang, aksen |
| `utils.ts` | `truncate`, `calcDiscountPercent` | batas, 0%, 100% |
| `validators.ts` | `registerSchema`, `checkoutSchema`, `reviewSchema` | input valid/invalid (zod) |
| `rate-limit.ts` | `resolveRule`, `consume`, `getClientIp` | pola route, blokir saat lewat limit, XFF |
| `invoice.ts` | `buildInvoicePdf` | output `%PDF-1.4`, ada `xref`+`%%EOF`, byte > 0 |
| `whatsapp.ts` | normalisasi nomor + `isConfigured` | 08xx→62xx, env kosong → no-op |

**Perintah:**
```bash
npm test                    # semua test
npx tsx --test tests/loyalty.test.ts   # satu file
```

**Kriteria lulus:** semua `PASS`, exit code 0.

---

## L2 — Integrasi API (mock, tanpa kredensial asli)

**Tujuan:** uji route API + alur pembayaran tanpa menyentuh Mayar/DB produksi.

**Sudah ada:** `scripts/mock-mayar-server.mjs` + `scripts/e2e-mayar-flow.ts`
(cart → order → create payment → simulasi bayar → webhook → order lunas,
termasuk **kasus negatif**: nominal tak cocok → order TIDAK boleh lunas).

**Target tambahan — `tests/api-smoke.test.ts`** (atau script terpisah):
| Endpoint | Method | Harapan |
|---|---|---|
| `/api/site-content` | GET | 200 + 40 field |
| `/api/site-profile` | GET | 200 |
| `/api/products` | GET | 200 + array |
| `/api/products/featured` | GET | 200 |
| `/api/categories` | GET | 200 |
| `/api/admin/*` (tanpa sesi) | GET | **403** (guard admin) |
| `/api/user/points` (tanpa sesi) | GET | **401** (guard auth) |
| `/api/orders/X/invoice` (tanpa sesi) | GET | **401** |
| `/api/cron/abandoned-cart` (tanpa secret) | GET | **401** |
| `/api/shipping/cost` | POST | 200/400 sesuai payload |

**Perintah:**
```bash
# terminal 1
node scripts/mock-mayar-server.mjs 4599
# terminal 2
npx tsx scripts/e2e-mayar-flow.ts
```

**Kriteria lulus:** semua endpoint balas status sesuai desain; alur Mayar lunas; kasus negatif ditolak.

---

## L3 — E2E Alur Kritis (dev server + DB)

**Tujuan:** verifikasi alur end-to-end yang menyentuh DB.

### Skenario wajib
1. **Register** → user + cart + (opsional) referral tercatat.
2. **Checkout** → order + stok berkurang (guard `gte` mencegah minus).
3. **Pembayaran lunas** → status `paid`, poin bertambah, notif admin dibuat.
4. **Invoice** → PDF valid diunduh.
5. **Ulasan** → setelah `delivered`, ulasan tersimpan + foto terunggah.
6. **Retur/refund** → (belum ada; target v3).

### Data uji
- Pakai **akun uji** (`E2E_EMAIL`/`E2E_PASSWORD`).
- **Bersihkan** order/stok/cart di `finally` (pola `e2e-mayar-flow.ts`).
- ⚠️ **Jangan** arahkan ke DB produksi — pakai `.env.local` dengan DB uji.

**Perintah:**
```bash
npx tsx scripts/e2e-mayar-flow.ts
```

**Kriteria lulus:** semua langkah sukses + cleanup bersih + tak ada sisa data.

---

## L4 — Smoke Produksi (URL live)

**Tujuan:** pastikan deploy sehat, tanpa data uji.

```bash
BASE=https://jagofarm-ecommerce.vercel.app
for p in /api/site-content /api/site-profile /api/products; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' $BASE$p)  $p"   # harap 200
done
# guard harus 401/403:
echo "$(curl -s -o /dev/null -w '%{http_code}' $BASE/api/admin/reports)"      # 403
echo "$(curl -s -o /dev/null -w '%{http_code}' $BASE/api/orders/X/invoice)"   # 401
echo "$(curl -s -o /dev/null -w '%{http_code}' $BASE/api/cron/abandoned-cart)" # 401
```

**Kriteria lulus:** publik 200; ber-guard 401/403.

---

## Gerbang Mutu (Quality Gates)

Setiap perubahan wajib lulus **minimal**:
```bash
npx tsc --noEmit      # 0 error
npm run lint          # 0 error, 0 warning
npm test              # 37/37 (atau lebih) lulus
```

Sebelum rilis: tambah L3 + build.
Pasca-deploy: L4.

---

## Cara Subagent Menjalankan (brief standar)

Saat mendelegasikan verifikasi, gunakan brief ini:

```
Goal: Jalankan <lapis L1|L2|L3|L4> untuk JagoFarm dan laporkan hasil.
Context:
  Repo: C:\Users\shafnats\Development\jagofarm-ecommerce
  HARD RULES: jangan git, jangan ubah kode, jangan sentuh prisma/schema.prisma.
  Perintah: <satu perintah lapis>
  Harapan: <kriteria lulus>
Output schema: { lapis: string, perintah: string, lulus: boolean, detail: string }
```

**Aturan:** satu subagent = satu lapis = satu perintah. Jangan gabung.

---

## Struktur File yang Diusulkan

```
tests/
  ├── discount-price.test.ts        (ada)
  ├── mayar-webhook-secret.test.ts  (ada)
  ├── midtrans-signature.test.ts    (ada)
  ├── shipping-quote.test.ts        (ada)
  ├── site-settings.test.ts         (ada)
  ├── store-profile.test.ts         (ada)
  ├── site-content.test.ts          (ada)
  ├── loyalty.test.ts               ★BARU
  ├── utils.test.ts                 ★BARU
  ├── validators.test.ts            ★BARU
  ├── rate-limit.test.ts            ★BARU
  ├── invoice-pdf.test.ts           ★BARU
  └── whatsapp.test.ts              ★BARU
scripts/
  ├── mock-mayar-server.mjs         (ada)
  ├── e2e-mayar-flow.ts             (ada)
  └── smoke-production.sh           ★BARU
```

---

## Peta Prioritas

| Prioritas | Item | Alasan |
|---|---|---|
| 🔴 1 | `loyalty.test.ts`, `utils.test.ts` | Fungsi murni, dipakai luas, mudah |
| 🔴 2 | `invoice-pdf.test.ts` | Verifikasi PDF valid (fitur baru A2) |
| 🟡 3 | `validators.test.ts`, `rate-limit.test.ts` | Keamanan input & rate limit |
| 🟡 4 | `smoke-production.sh` | Cek cepat pasca-deploy |
| 🟢 5 | `whatsapp.test.ts` | Perlu env, no-op test |
| 🟢 6 | API smoke (L2) | Perlu dev server |

---

## Catatan Penting

- **Test lama tidak dijalankan otomatis** — `npm test` mendaftar file satu per satu di `package.json`. File baru **harus** ditambahkan ke script `test`.
- **Tak ada config vitest/jest** — pakai `node:test` + `tsx`. Jangan tambah dependensi.
- **Fungsi murni dulu** — jangan mock DB bila bisa hindari (L1).
- **DB produksi = DB dev** (Supabase sama) → hati-hati di L3; selalu cleanup.

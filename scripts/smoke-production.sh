#!/usr/bin/env bash
# smoke-production.sh — Smoke test L4 (tanpa data uji, aman di produksi)
#
# Cek: endpoint publik balas 200; endpoint ber-guard balas 401/403.
# Jalankan: bash scripts/smoke-production.sh [BASE_URL]
# Default BASE_URL: https://jagofarm-ecommerce.vercel.app

set -u
BASE="${1:-https://jagofarm-ecommerce.vercel.app}"
BASE="${BASE%/}"

pass=0
fail=0

check() {
  local expected="$1" path="$2" label="$3"
  local code
  # --max-time gagal -> curl cetak 000; jangan tambah echo (bikin "200000").
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$BASE$path" 2>/dev/null)
  [ -z "$code" ] && code="000"
  if [ "$code" = "$expected" ]; then
    echo "  ✓ $code  $path  ($label)"
    pass=$((pass + 1))
  else
    echo "  ✗ $code  $path  ($label) — harap $expected"
    fail=$((fail + 1))
  fi
}

echo "Smoke test: $BASE"
echo ""
echo "[publik — harap 200]"
check 200 "/"                        "beranda"
check 200 "/api/site-content"        "konten CMS"
check 200 "/api/site-profile"        "profil toko"
check 200 "/api/products"            "daftar produk"
check 200 "/api/products/featured"   "produk unggulan"
check 200 "/api/categories"          "kategori"

echo ""
echo "[ber-guard — harap 401/403]"
check 403 "/api/admin/reports"          "laporan (admin)"
check 403 "/api/admin/orders"           "pesanan (admin)"
check 403 "/api/admin/orders/export"    "export CSV (admin)"
check 401 "/api/orders/TEST/invoice"    "invoice (auth)"
check 401 "/api/user/points"            "poin (auth)"
check 401 "/api/user/referral"          "referral (auth)"
check 401 "/api/cron/abandoned-cart"    "cron (secret)"

echo ""
echo "Hasil: $pass lulus, $fail gagal"
[ "$fail" -eq 0 ] && exit 0 || exit 1

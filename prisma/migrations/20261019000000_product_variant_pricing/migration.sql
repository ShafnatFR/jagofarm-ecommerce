-- Sistem varian produk: harga absolut per varian.
--
-- Konteks: tabel products/product_variants masih kosong saat migrasi ini
-- ditulis (0 produk, 0 varian, 0 order_item), sehingga perubahan kolom bisa
-- dilakukan langsung tanpa backfill bertahap dan tanpa kolom transisi.
--
-- Ringkasan perubahan:
--   products          + has_variants, min_price, max_price (+ index)
--   product_variants  + price, weight_gram, is_active, sort_order
--                     - price_modifier (diganti price absolut)

-- ── products ──────────────────────────────────────────────────────────────
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "has_variants" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "min_price" DECIMAL(12,2);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "max_price" DECIMAL(12,2);

CREATE INDEX IF NOT EXISTS "products_has_variants_min_price_max_price_idx"
  ON "products"("has_variants", "min_price", "max_price");

-- ── product_variants ──────────────────────────────────────────────────────
-- `price` diberi DEFAULT 0 sementara agar ALTER pada tabel berisi data tidak
-- gagal; default dihapus lagi di akhir supaya API wajib mengirim harga.
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "price" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "product_variants" ALTER COLUMN "price" DROP DEFAULT;

ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "weight_gram" INTEGER;
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0;

-- Pindahkan data lama (bila ada) dari price_modifier ke price absolut.
-- Harga varian = harga dasar produk + selisih yang tersimpan sebelumnya.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'price_modifier'
  ) THEN
    UPDATE "product_variants" v
    SET "price" = p."base_price" + v."price_modifier"
    FROM "products" p
    WHERE p."id" = v."product_id";

    ALTER TABLE "product_variants" DROP COLUMN "price_modifier";
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "product_variants_product_id_sort_order_idx"
  ON "product_variants"("product_id", "sort_order");

-- Tandai produk yang sudah punya varian & isi cache min/max harga.
UPDATE "products" p
SET "has_variants" = true
WHERE EXISTS (
  SELECT 1 FROM "product_variants" v
  WHERE v."product_id" = p."id" AND v."is_active" = true
);

UPDATE "products" p
SET "min_price" = agg.min_price,
    "max_price" = agg.max_price,
    "stock" = 0
FROM (
  SELECT "product_id", MIN("price") AS min_price, MAX("price") AS max_price
  FROM "product_variants"
  WHERE "is_active" = true
  GROUP BY "product_id"
) agg
WHERE agg."product_id" = p."id";

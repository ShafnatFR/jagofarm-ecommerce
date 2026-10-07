-- Marketplace-grade shipping metadata and quote snapshots.
-- All fields are nullable/defaulted so existing catalog, addresses, and orders remain valid.
ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "length_cm" INTEGER,
  ADD COLUMN IF NOT EXISTS "width_cm" INTEGER,
  ADD COLUMN IF NOT EXISTS "height_cm" INTEGER;

ALTER TABLE "addresses"
  ADD COLUMN IF NOT EXISTS "province_id" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "city_id" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "district_id" VARCHAR(20);

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "shipping_quote_source" VARCHAR(30),
  ADD COLUMN IF NOT EXISTS "shipping_quote_fetched_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "shipping_origin_city_id" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "shipping_destination_city_id" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "shipping_destination_district_id" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "shipping_actual_weight_gram" INTEGER,
  ADD COLUMN IF NOT EXISTS "shipping_volumetric_weight_gram" INTEGER,
  ADD COLUMN IF NOT EXISTS "shipping_chargeable_weight_gram" INTEGER,
  ADD COLUMN IF NOT EXISTS "shipping_quote_snapshot" JSONB;

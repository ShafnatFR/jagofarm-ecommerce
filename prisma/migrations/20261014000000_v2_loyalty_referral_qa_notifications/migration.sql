-- Update v2: loyalty (A7), referral (A8), abandoned-cart (A9),
-- tanya-jawab produk (B19), notifikasi admin (B18/A14).
-- Idempoten (IF NOT EXISTS) supaya aman dijalankan ulang.

-- ── A7 Loyalty: kolom users.points ──────────────────────
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "points" INTEGER NOT NULL DEFAULT 0;

-- ── A8 Referral: kolom users.referral_code ──────────────
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referral_code" VARCHAR(20);
CREATE UNIQUE INDEX IF NOT EXISTS "users_referral_code_key" ON "users"("referral_code");

-- ── A9 Abandoned cart: kolom carts.reminder_sent_at ─────
ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "reminder_sent_at" TIMESTAMP(3);

-- ── A7 PointTransaction ─────────────────────────────────
CREATE TABLE IF NOT EXISTS "point_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "note" VARCHAR(255),
    "order_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_transactions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "point_transactions_user_id_created_at_idx"
    ON "point_transactions"("user_id", "created_at");
DO $$ BEGIN
    ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── A8 Referral ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "referrals" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "referee_id" TEXT NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "reward_points" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "order_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rewarded_at" TIMESTAMP(3),

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "referrals_referee_id_key" ON "referrals"("referee_id");
CREATE INDEX IF NOT EXISTS "referrals_owner_id_idx" ON "referrals"("owner_id");
DO $$ BEGIN
    ALTER TABLE "referrals" ADD CONSTRAINT "referrals_owner_id_fkey"
        FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referee_id_fkey"
        FOREIGN KEY ("referee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── B19 ProductQuestion ─────────────────────────────────
CREATE TABLE IF NOT EXISTS "product_questions" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "user_id" VARCHAR(36),
    "asker_name" VARCHAR(100) NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "answered_by" VARCHAR(36),
    "answered_at" TIMESTAMP(3),
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_questions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "product_questions_product_id_is_published_created_at_idx"
    ON "product_questions"("product_id", "is_published", "created_at");
DO $$ BEGIN
    ALTER TABLE "product_questions" ADD CONSTRAINT "product_questions_product_id_fkey"
        FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── B18/A14 AdminNotification ───────────────────────────
CREATE TABLE IF NOT EXISTS "admin_notifications" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT,
    "href" VARCHAR(300),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "admin_notifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "admin_notifications_is_read_created_at_idx"
    ON "admin_notifications"("is_read", "created_at");

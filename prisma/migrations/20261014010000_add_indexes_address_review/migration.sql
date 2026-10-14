-- Add indexes for frequently filtered columns (performance).
-- Idempotent: safe to re-run.

-- Address.userId: filtered in /api/user/addresses, /api/orders, /api/shipping/cost
CREATE INDEX IF NOT EXISTS "addresses_user_id_idx" ON "addresses"("user_id");

-- Review.isApproved + createdAt: filtered/sorted in /api/admin/reviews, /api/reviews
CREATE INDEX IF NOT EXISTS "reviews_is_approved_created_at_idx" ON "reviews"("is_approved", "created_at");

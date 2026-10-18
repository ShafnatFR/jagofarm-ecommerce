-- Tambah kolom untuk konsultasi tanpa login (guest)
ALTER TABLE "consultation_sessions" ADD COLUMN IF NOT EXISTS "guest_name" VARCHAR(100);
ALTER TABLE "consultation_sessions" ADD COLUMN IF NOT EXISTS "guest_email" VARCHAR(255);
ALTER TABLE "consultation_sessions" ADD COLUMN IF NOT EXISTS "guest_phone" VARCHAR(20);

-- Index untuk pencarian cepat berdasarkan email tamu
CREATE INDEX IF NOT EXISTS "consultation_sessions_guest_email_idx" ON "consultation_sessions"("guest_email");

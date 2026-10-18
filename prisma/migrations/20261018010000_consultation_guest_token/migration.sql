-- Kunci akses tamu untuk tiket konsultasi tanpa akun.
-- Token disimpan di browser tamu (localStorage) dan menjadi bukti kepemilikan
-- tiket: tanpa token ini, orang lain tidak bisa membaca/membalas tiketnya.
ALTER TABLE "consultation_sessions" ADD COLUMN IF NOT EXISTS "access_token" VARCHAR(64);

CREATE UNIQUE INDEX IF NOT EXISTS "consultation_sessions_access_token_key"
  ON "consultation_sessions"("access_token");

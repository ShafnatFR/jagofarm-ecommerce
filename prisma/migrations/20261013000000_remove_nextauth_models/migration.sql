-- Remove NextAuth leftover models (Account, Session, VerificationToken).
-- The app uses Supabase Auth; these tables are no longer referenced anywhere in code.
-- Destructive migration: drops tables and their dependent objects (CASCADE).
DROP TABLE IF EXISTS "nextauth_sessions" CASCADE;
DROP TABLE IF EXISTS "accounts" CASCADE;
DROP TABLE IF EXISTS "verification_tokens" CASCADE;

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: "customer" | "admin";
};

/**
 * Backward-compatible `auth()` that returns a NextAuth-like session object.
 * Used by API routes that do: const session = await auth()
 */
export async function auth() {
  const user = await getCurrentUser();
  if (!user) return null;
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
    },
  };
}

/**
 * Error kontrol-flow internal Next (DYNAMIC_SERVER_USAGE, NEXT_REDIRECT,
 * NEXT_NOT_FOUND) dipakai framework untuk menentukan mode render/redirect —
 * JANGAN ditelan, harus dilempar ulang.
 */
function isNextControlFlowError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string";
}

/**
 * Ambil user Supabase tanpa pernah melempar error.
 * Supabase bisa belum dikonfigurasi atau tidak terjangkau — dalam kasus itu
 * pemanggil cukup dianggap belum login (bukan 500).
 */
async function fetchSupabaseUser() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    console.error(
      "[auth] Supabase tidak dapat dihubungi atau belum dikonfigurasi:",
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/** Make sure the user has a cart (idempotent, never throws). */
async function ensureCart(userId: string) {
  try {
    await prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  } catch (error) {
    console.error("[auth] failed to ensure cart for user", userId, error);
  }
}

/**
 * Get current authenticated user from Supabase Auth,
 * synced to our users table.
 *
 * - Supabase user without a Postgres row -> row + cart are created.
 * - Postgres row found by email but with a different id -> the existing row wins
 *   (never crash on the mismatch; a warning is logged instead).
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const authUser = await fetchSupabaseUser();
  if (!authUser?.email) return null;

  const email = authUser.email.toLowerCase();

  // 1) Cocokkan lewat supabase_id (cara utama, tidak bergantung email).
  let dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
  });

  // 2) Belum tertaut: cari baris lama berdasarkan email (mis. hasil seed),
  //    lalu tautkan supabase_id-nya supaya request berikutnya tidak ambigu.
  if (!dbUser) {
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) {
      dbUser = byEmail.supabaseId
        ? byEmail
        : await prisma.user.update({
            where: { id: byEmail.id },
            data: { supabaseId: authUser.id },
          });
      if (!byEmail.supabaseId) {
        console.info(
          `[auth] baris users lama untuk ${email} ditautkan ke Supabase user ${authUser.id} (role ${byEmail.role} dipertahankan).`
        );
      }
    }
  }

  if (!dbUser) {
    const metadata = authUser.user_metadata ?? {};
    try {
      dbUser = await prisma.user.create({
        data: {
          id: authUser.id,
          supabaseId: authUser.id,
          email,
          name: metadata.full_name || metadata.name || null,
          image: metadata.avatar_url || metadata.picture || null,
          role: "customer",
        },
      });
    } catch (error) {
      // Most likely a concurrent request created the row first (or a legacy row
      // with the same email) — fall back to reading it instead of failing.
      console.error("[auth] failed to create users row from Supabase user:", error);
      dbUser = await prisma.user.findUnique({ where: { email } });
      if (!dbUser) throw error;
    }
  }

  await ensureCart(dbUser.id);

  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    image: dbUser.image,
    role: dbUser.role as "customer" | "admin",
  };
}

/**
 * Require authenticated user or throw
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

/**
 * Require admin role or throw
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role === "customer") throw new Error("Forbidden");
  return user;
}

/**
 * Explicit admin guard: throws unless the current user is admin.
 * Prefer this in new admin-only code paths.
 */
export async function requireAdminUser(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role !== "admin") throw new Error("Forbidden");
  return user;
}

/**
 * Require admin role or throw.
 */
export async function requireStrictAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role !== "admin") throw new Error("Forbidden");
  return user;
}

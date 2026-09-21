import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: "customer" | "admin" | "staff";
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
 * Get current authenticated user from Supabase Auth,
 * synced to our users table.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser?.email) return null;

  // Find or create user in our users table
  let dbUser = await prisma.user.findUnique({
    where: { email: authUser.email },
  });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || "",
        image: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
        role: "customer",
      },
    });
    // Create cart for new user
    await prisma.cart.create({ data: { userId: dbUser.id } });
  }

  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    image: dbUser.image,
    role: dbUser.role as "customer" | "admin" | "staff",
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
 * Require admin/staff role or throw
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role === "customer") throw new Error("Forbidden");
  return user;
}

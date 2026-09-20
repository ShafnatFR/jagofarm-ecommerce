import NextAuth, { type DefaultSession, type User as NextAuthUser } from "next-auth";
import type { Adapter } from "@auth/core/adapters";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "customer" | "admin" | "staff";
    } & DefaultSession["user"];
  }

  interface User {
    role: "customer" | "admin" | "staff";
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "jagofarm-secret-key-production-2026",
  trustHost: true,
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      issuer: "https://accounts.google.com",
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role as "customer" | "admin" | "staff",
        };
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      if (user.id) {
        try {
          await prisma.cart.upsert({
            where: { userId: user.id },
            create: { userId: user.id },
            update: {},
          });
        } catch (e) {
          console.error("Error creating cart for new user:", e);
        }
      }
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (user && user.id) {
        try {
          await prisma.cart.upsert({
            where: { userId: user.id },
            create: { userId: user.id },
            update: {},
          });
        } catch (e) {
          console.error("Error upserting cart on signIn:", e);
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || "customer";
      }

      if (trigger === "update" && session) {
        token.name = session.user?.name;
        token.email = session.user?.email;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "customer" | "admin" | "staff") || "customer";
      }

      return session;
    },
  },
});

/**
 * Helper: get current session user or null
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Helper: require authenticated user or throw
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * Helper: require admin/staff role or throw
 */
export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role === "customer") {
    throw new Error("Forbidden");
  }
  return user;
}

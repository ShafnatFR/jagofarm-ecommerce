import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side alternative to calling `supabase.auth.updateUser({ password })`
 * from the browser (see src/app/reset-password/page.tsx).
 * Requires an active session — i.e. the user opened a valid recovery link.
 */
const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const firstMessage = parsed.error.issues[0]?.message ?? "Data tidak valid";
      return NextResponse.json({ error: firstMessage }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Link tidak valid atau kadaluarsa. Silakan minta tautan baru." },
        { status: 401 }
      );
    }

    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Password berhasil diperbarui. Silakan masuk kembali." });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}

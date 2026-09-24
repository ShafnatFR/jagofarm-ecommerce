"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Leaf, AlertCircle, CheckCircle } from "lucide-react";

type Status = "loading" | "ready" | "invalid" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // A valid reset link gives us a (recovery) session — either already exchanged by
  // /auth/callback, or parsed from the URL hash by the browser client.
  useEffect(() => {
    const supabase = createClient();
    let active = true;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        setStatus("ready");
        return;
      }
      // The client may still be consuming the recovery link from the URL.
      retryTimer = setTimeout(async () => {
        const { data: retry } = await supabase.auth.getSession();
        if (!active) return;
        setStatus(retry.session ? "ready" : "invalid");
      }, 1200);
    };

    void check();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")) {
        setStatus("ready");
      }
    });

    return () => {
      active = false;
      if (retryTimer) clearTimeout(retryTimer);
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message || "Gagal memperbarui password");
      setLoading(false);
      return;
    }

    setStatus("done");
    setLoading(false);

    // Sign out of the recovery session so the user logs in with the new password.
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore — the redirect below is what matters
    }
    setTimeout(() => router.push("/login?reset=true"), 2500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Leaf className="w-7 h-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Atur Ulang Password</CardTitle>
          <CardDescription>
            {status === "done"
              ? "Password Anda sudah diperbarui."
              : "Masukkan password baru untuk akun JagoFarm Anda."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "loading" && (
            <div className="space-y-3">
              <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
              <div className="h-10 w-full bg-muted animate-pulse rounded" />
              <div className="h-10 w-full bg-muted animate-pulse rounded" />
            </div>
          )}

          {status === "invalid" && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="h-16 w-16 text-red-500" />
              </div>
              <p className="text-sm text-muted-foreground">
                Link tidak valid atau kadaluarsa. Silakan minta tautan reset password baru.
              </p>
              <Link href="/forgot-password">
                <Button className="w-full">Minta Link Baru</Button>
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center gap-1 text-sm text-primary hover:underline"
              >
                Kembali ke Login
              </Link>
            </div>
          )}

          {status === "done" && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <p className="text-sm text-muted-foreground">
                Password berhasil diperbarui. Mengarahkan Anda ke halaman masuk...
              </p>
              <Link href="/login?reset=true">
                <Button variant="secondary" className="w-full">
                  Masuk sekarang
                </Button>
              </Link>
            </div>
          )}

          {status === "ready" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Password Baru</label>
                <Input
                  type="password"
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Konfirmasi Password Baru</label>
                <Input
                  type="password"
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan Password Baru"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

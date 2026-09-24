"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Leaf, MailCheck, ArrowLeft } from "lucide-react";

type FieldErrors = Record<string, string[] | undefined>;

function readApiError(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const error = (data as { error?: unknown }).error;
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    const errors = error as FieldErrors;
    const first = Object.values(errors).flat().find((message) => typeof message === "string" && message);
    if (first) return first;
  }
  return null;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Password tidak cocok");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(readApiError(data) || "Gagal mendaftar");
        setLoading(false);
        return;
      }

      // Case (b): Supabase returned a session -> the user is already signed in.
      if (data?.session) {
        router.push("/");
        router.refresh();
        return;
      }

      // Case (a): email confirmation required.
      setAwaitingConfirmation(true);
      setLoading(false);
    } catch {
      setError("Terjadi kesalahan");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Leaf className="w-7 h-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Daftar di JagoFarm</CardTitle>
          <CardDescription>
            {awaitingConfirmation ? (
              "Konfirmasi email Anda untuk mengaktifkan akun."
            ) : (
              <>
                Sudah punya akun?{" "}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Masuk
                </Link>
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {awaitingConfirmation ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <MailCheck className="h-16 w-16 text-green-500" />
              </div>
              <p className="text-sm text-muted-foreground">
                Pendaftaran berhasil. Kami mengirim tautan konfirmasi ke{" "}
                <strong>{form.email}</strong>. Silakan konfirmasi email Anda terlebih dahulu, lalu masuk. Cek juga
                folder spam bila email belum terlihat.
              </p>
              <Link href="/login">
                <Button variant="secondary" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
              )}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Nama Lengkap</label>
                <Input
                  placeholder="Nama lengkap"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email</label>
                <Input
                  type="email"
                  placeholder="nama@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">No. WhatsApp</label>
                <Input
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Password</label>
                <Input
                  type="password"
                  placeholder="Minimal 8 karakter"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Konfirmasi Password</label>
                <Input
                  type="password"
                  placeholder="Ulangi password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Mendaftar..." : "Daftar"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Leaf, Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentMessage, setSentMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          typeof data?.error === "string" ? data.error : "Gagal mengirim email"
        );
      }
      setSentMessage(
        typeof data?.message === "string"
          ? data.message
          : "Jika email tersebut terdaftar, kami telah mengirim tautan reset password."
      );
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
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
          <CardTitle className="text-2xl">Lupa Password</CardTitle>
          <CardDescription>
            Masukkan email Anda dan kami akan mengirimkan link untuk mengatur ulang password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <p className="text-sm text-muted-foreground">
                {sentMessage} Cek inbox atau folder spam pada <strong>{email}</strong>.
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
                <label className="text-sm font-medium mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Mengirim..." : "Kirim Link Reset"}
              </Button>
              <Link href="/login" className="flex items-center justify-center gap-1 text-sm text-primary hover:underline">
                <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Login
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

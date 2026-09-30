"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";

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
    <>
      {/* Ambient Decorative Elements */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #1B4D3E 1px, transparent 0)", backgroundSize: "40px 40px" }} />
      <div aria-hidden="true" className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-primary-fixed-100/40 via-transparent to-transparent blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="relative z-10 w-full pt-8 pb-4 px-6 sm:px-10 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20 group-hover:scale-105 transition-transform duration-200">
            <Icon name="eco" size={20} className="text-tertiary-fixed" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-primary leading-none">JagoFarm</span>
            <span className="text-[11px] font-medium text-primary tracking-wider uppercase mt-0.5">Agri & Aquaculture</span>
          </div>
        </Link>
        <a className="text-xs sm:text-sm font-medium text-slate-600 hover:text-primary flex items-center gap-1.5 transition-colors" href="#">
          <Icon name="help" size={16} className="text-primary" />
          <span>Bantuan Teknis</span>
        </a>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-grow flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-[480px]">
          <section className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl sm:rounded-3xl p-7 sm:p-10 shadow-lg relative overflow-hidden">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary-fixed-600 to-primary" />

            {sent ? (
              <div className="text-center space-y-5 py-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center">
                    <Icon name="mark_email_read" size={32} className="text-primary" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-slate-900">Email Terkirim</h2>
                <p className="text-sm text-slate-600 max-w-sm mx-auto">
                  {sentMessage} Cek inbox atau folder spam pada <strong>{email}</strong>.
                </p>
                <Link href="/login">
                  <button className="w-full py-3 px-6 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 text-sm">
                    <Icon name="arrow_back" size={16} />
                    Kembali ke Login
                  </button>
                </Link>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/25 mb-5 ring-4 ring-emerald-50 relative">
                    <Icon name="eco" size={28} className="text-primary-fixed-dim" />
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary border-2 border-white" />
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight mb-2.5">Lupa Password</h1>
                  <p className="text-slate-600 text-sm sm:text-[15px] leading-relaxed max-w-sm mb-7">
                    Masukkan email Anda dan kami akan mengirimkan link untuk mengatur ulang password.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-200">{error}</div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold text-slate-700">Email</label>
                      <span className="text-xs text-slate-400">Akun terdaftar</span>
                    </div>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Icon name="email" size={20} />
                      </div>
                      <input
                        type="email"
                        autoComplete="email"
                        placeholder="nama@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="block w-full pl-11 pr-4 py-3 sm:py-3.5 text-sm sm:text-base text-slate-900 bg-slate-50/70 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-slate-400"
                      />
                    </div>
                    <p className="text-xs text-slate-500 pl-1">Pastikan email aktif untuk menerima instruksi pemulihan.</p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary hover:bg-primary-container active:scale-[0.99] text-white font-semibold text-sm sm:text-base shadow-md transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-60"
                    >
                      <span>{loading ? "Mengirim..." : "Kirim Link Reset"}</span>
                      {!loading && <Icon name="arrow_forward" size={16} className="text-tertiary-fixed" />}
                    </button>
                  </div>

                  <div className="pt-3 text-center">
                    <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary transition-colors py-1 group">
                      <Icon name="arrow_back" size={16} className="transition-transform duration-200 group-hover:-translate-x-1" />
                      <span>Kembali ke Login</span>
                    </Link>
                  </div>
                </form>

                {/* Help section */}
                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-1.5 text-xs text-slate-500 text-center">
                  <span>Butuh bantuan akses akun?</span>
                  <a className="font-medium text-primary hover:text-emerald-900 underline underline-offset-2 inline-flex items-center gap-1" href="#">
                    <span>Hubungi CS JagoFarm</span>
                    <Icon name="open_in_new" size={12} />
                  </a>
                </div>
              </>
            )}
          </section>

          {/* Security footnote */}
          <aside className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Icon name="verified_user" size={16} className="text-primary flex-shrink-0" />
            <span>Data & privasi dilindungi enkripsi standar SSL 256-bit</span>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/60 pt-4">
          <p>&copy; 2025 JagoFarm Indonesia. Solusi Pertanian & Akuakultur Modern.</p>
          <div className="flex items-center gap-5 text-slate-500">
            <a className="hover:text-primary transition-colors" href="#">Syarat & Ketentuan</a>
            <span>&bull;</span>
            <a className="hover:text-primary transition-colors" href="#">Kebijakan Privasi</a>
          </div>
        </div>
      </footer>
    </>
  );
}
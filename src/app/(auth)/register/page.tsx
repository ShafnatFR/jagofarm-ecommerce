"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";

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
  const [showPassword, setShowPassword] = useState(false);

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

      if (data?.session) {
        router.push("/");
        router.refresh();
        return;
      }

      setAwaitingConfirmation(true);
      setLoading(false);
    } catch {
      setError("Terjadi kesalahan");
      setLoading(false);
    }
  };

  return (
    <main className="w-full min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[760px]">
          {/* Left Branded Showcase */}
          <section className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-emerald-900 via-primary to-emerald-950 p-10 flex-col justify-between relative overflow-hidden text-white">
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                  <Icon name="eco" size={24} className="text-emerald-400" />
                </div>
                <div>
                  <span className="text-2xl font-bold tracking-tight text-white block leading-none">JagoFarm</span>
                  <span className="text-[11px] font-medium text-emerald-300/80 tracking-wide uppercase">Smart Agri-Aquaculture</span>
                </div>
              </div>
              <div className="mt-12 space-y-3">
                <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                  Platform Pertanian #1 di Indonesia
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight leading-snug text-white">
                  Mulai Perjalanan Pertanian Modern Anda Bersama Kami.
                </h1>
                <p className="text-sm text-emerald-100/80 leading-relaxed font-normal">
                  Akses ribuan bibit unggul, paket kit hidroponik, pakan akuakultur, dan pemantauan IoT smart farming terintegrasi dalam satu platform.
                </p>
              </div>
            </div>

            <div className="relative z-10 my-8 space-y-3.5">
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5 text-emerald-300">
                  <Icon name="check" size={16} />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">Kualitas Teruji & Terverifikasi</h2>
                  <p className="text-xs text-emerald-100/70 mt-0.5">Semua bibit dan nutrisi lolos kurasi ahli agronomi bersertifikasi.</p>
                </div>
              </div>
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5 text-emerald-300">
                  <Icon name="bolt" size={16} />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">Teknologi IoT Terpadu</h2>
                  <p className="text-xs text-emerald-100/70 mt-0.5">Pantau sensor pH, suhu nutrisi, dan dissolved oxygen langsung lewat smartphone.</p>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-emerald-200/90">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2 overflow-hidden">
                  <span className="inline-block h-7 w-7 rounded-full bg-emerald-300 text-slate-800 font-bold flex items-center justify-center text-[10px] ring-2 ring-primary">BP</span>
                  <span className="inline-block h-7 w-7 rounded-full bg-teal-200 text-slate-800 font-bold flex items-center justify-center text-[10px] ring-2 ring-primary">AH</span>
                  <span className="inline-block h-7 w-7 rounded-full bg-emerald-100 text-slate-800 font-bold flex items-center justify-center text-[10px] ring-2 ring-primary">RS</span>
                </div>
                <span>Bergabung bersama <strong className="text-white font-semibold">10.000+</strong> petani modern</span>
              </div>
            </div>
          </section>

          {/* Right Registration Form */}
          <section className="col-span-1 lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
            <div>
              <div className="text-center sm:text-left mb-6">
                <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/10">
                    <Icon name="eco" size={28} className="text-white" />
                  </div>
                  <div className="lg:hidden text-left">
                    <span className="text-xl font-bold tracking-tight text-emerald-900 block leading-tight">JagoFarm</span>
                    <span className="text-xs text-slate-500">Modern Agri-Aquaculture</span>
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {awaitingConfirmation ? "Cek Email Anda" : "Daftar di JagoFarm"}
                </h2>
                <p className="text-sm text-slate-500 mt-1.5">
                  {awaitingConfirmation ? (
                    "Konfirmasi email Anda untuk mengaktifkan akun."
                  ) : (
                    <>
                      Sudah punya akun?{" "}
                      <Link href="/login" className="font-semibold text-primary hover:underline ml-1">Masuk</Link>
                    </>
                  )}
                </p>
              </div>

              {awaitingConfirmation ? (
                <div className="text-center space-y-6 py-8">
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
                      <Icon name="mark_email_read" size={40} className="text-emerald-600" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 max-w-sm mx-auto">
                    Pendaftaran berhasil. Kami mengirim tautan konfirmasi ke <strong>{form.email}</strong>. Silakan konfirmasi email Anda terlebih dahulu, lalu masuk. Cek juga folder spam bila email belum terlihat.
                  </p>
                  <Link href="/login">
                    <button className="w-full py-3 px-6 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 text-sm">
                      <Icon name="arrow_back" size={16} />
                      Kembali ke Login
                    </button>
                  </Link>
                </div>
              ) : (
                <>
                  {/* Google Registration */}
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-all duration-200 text-sm font-semibold shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" fill="#4285F4" />
                      <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" fill="#34A853" />
                      <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" fill="#FBBC05" />
                      <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" fill="#EA4335" />
                    </svg>
                    <span>Daftar dengan Google</span>
                  </button>

                  {/* Divider */}
                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                    <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-slate-400 font-medium uppercase tracking-wider">atau daftar dengan email</span></div>
                  </div>

                  {error && (
                    <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-200">{error}</div>
                  )}

                  {/* Registration Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nama Lengkap */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Nama Lengkap</label>
                      <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Icon name="person" size={16} />
                        </div>
                        <input
                          type="text"
                          placeholder="Contoh: Budi Santoso"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          required
                          className="block w-full pl-10 pr-3.5 py-2.5 sm:py-3 text-sm text-slate-800 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 placeholder:text-slate-400 transition"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Email</label>
                      <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Icon name="email" size={16} />
                        </div>
                        <input
                          type="email"
                          placeholder="nama@email.com"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          required
                          className="block w-full pl-10 pr-3.5 py-2.5 sm:py-3 text-sm text-slate-800 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 placeholder:text-slate-400 transition"
                        />
                      </div>
                    </div>

                    {/* WhatsApp */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">No. WhatsApp</label>
                        <span className="text-[11px] text-slate-400 font-medium">Untuk notifikasi status pesanan</span>
                      </div>
                      <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Icon name="phone" size={16} />
                        </div>
                        <input
                          type="tel"
                          placeholder="08xxxxxxxxxx"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="block w-full pl-10 pr-3.5 py-2.5 sm:py-3 text-sm text-slate-800 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 placeholder:text-slate-400 transition"
                        />
                      </div>
                    </div>

                    {/* Password & Confirm */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Password</label>
                        <div className="relative rounded-xl shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Icon name="lock" size={16} />
                          </div>
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Minimal 8 karakter"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                            minLength={8}
                            className="block w-full pl-10 pr-10 py-2.5 sm:py-3 text-sm text-slate-800 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 placeholder:text-slate-400 transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                          >
                            <Icon name={showPassword ? "visibility_off" : "visibility"} size={16} />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Konfirmasi Password</label>
                        <div className="relative rounded-xl shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Icon name="shield" size={16} />
                          </div>
                          <input
                            type="password"
                            placeholder="Ulangi password"
                            value={form.confirmPassword}
                            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                            required
                            className="block w-full pl-10 pr-3.5 py-2.5 sm:py-3 text-sm text-slate-800 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 placeholder:text-slate-400 transition"
                          />
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                      <Icon name="info" size={14} className="text-emerald-600 shrink-0" />
                      Gunakan minimal 8 karakter dengan kombinasi huruf dan angka.
                    </p>

                    {/* Terms */}
                    <div className="pt-1">
                      <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
                        <input type="checkbox" required className="w-4 h-4 rounded text-primary focus:ring-emerald-500 border-slate-300 mt-0.5 transition" />
                        <span>
                          Saya menyetujui <a className="text-primary font-semibold underline decoration-emerald-300 hover:text-emerald-700" href="#">Syarat & Ketentuan</a> serta <a className="text-primary font-semibold underline decoration-emerald-300 hover:text-emerald-700" href="#">Kebijakan Privasi</a> JagoFarm.
                        </span>
                      </label>
                    </div>

                    {/* Submit */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-primary hover:bg-emerald-900 active:scale-[0.99] transition-all duration-200 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group text-sm tracking-wide focus:outline-none focus:ring-4 focus:ring-emerald-600/30 disabled:opacity-60"
                      >
                        <span>{loading ? "Mendaftar..." : "Daftar Sekarang"}</span>
                        {!loading && <Icon name="arrow_forward" size={16} className="text-emerald-300 group-hover:translate-x-0.5 transition-transform" />}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>

            {/* Trust Badges */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-slate-500 font-medium">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-1">
                  <Icon name="lock" size={16} className="text-emerald-600 shrink-0" />
                  <span>Enkripsi 256-bit</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-1">
                  <Icon name="verified" size={16} className="text-emerald-600 shrink-0" />
                  <span>100% Produk Asli</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-1">
                  <Icon name="support_agent" size={16} className="text-emerald-600 shrink-0" />
                  <span>Dukungan Ahli Tani</span>
                </div>
              </div>
              <div className="text-center mt-4">
                <span className="text-[11px] text-slate-400">&copy; 2026 JagoFarm Indonesia. Hak Cipta Dilindungi.</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
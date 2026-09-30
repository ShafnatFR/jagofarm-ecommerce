"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/icon";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const notice =
    searchParams.get("reset") === "true"
      ? "Password berhasil diperbarui. Silakan masuk dengan password baru Anda."
      : searchParams.get("registered") === "true"
        ? "Registrasi berhasil. Silakan masuk."
        : searchParams.get("error")
          ? "Link konfirmasi/reset tidak valid atau sudah kadaluarsa. Silakan coba lagi."
          : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      if (loginError.code === "email_not_confirmed" || /confirm/i.test(loginError.message)) {
        setError("Email belum dikonfirmasi. Silakan cek inbox Anda dan klik tautan konfirmasi terlebih dahulu.");
      } else {
        setError("Email atau password salah");
      }
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${callbackUrl}`,
      },
    });
  };

  return (
    <main className="flex-1 flex flex-col lg:flex-row w-full min-h-screen">
      {/* Left Hero Section */}
      <section className="hidden lg:flex lg:w-1/2 xl:w-7/12 relative bg-gradient-to-br from-primary via-primary-fixed-900 to-primary-fixed-800 text-white p-12 xl:p-16 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2.5 text-white/80 hover:text-white text-sm font-medium transition-colors group">
            <Icon name="arrow_back" size={16} className="transition-transform group-hover:-translate-x-1" />
            Kembali ke Beranda
          </Link>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-medium text-primary-fixed-dim flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            IoT Sensor Aktif 24/7
          </div>
        </div>

        <div className="relative z-10 max-w-xl my-auto py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-primary-fixed-dim text-xs font-semibold uppercase tracking-wider mb-6 border border-white/15">
            <Icon name="eco" size={14} />
            Platform Agroteknologi Terpadu
          </div>
          <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-extrabold tracking-tight text-white leading-tight mb-5">
            Solusi Pertanian & Akuakultur Modern Berbasis IoT
          </h1>
          <p className="text-slate-300 text-base xl:text-lg leading-relaxed mb-8">
            Kelola kolam bioflok, monitoring kualitas air, otomasi fertigasi, dan pantau hasil panen dalam satu ekosistem presisi terpercaya.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-primary/20 text-primary-fixed-dim rounded-lg shrink-0">
                <Icon name="water_drop" size={20} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Monitoring Kolam</h2>
                <p className="text-xs text-slate-300 mt-0.5">Suhu, pH, DO, & amonia terpantau otomatis</p>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-primary/20 text-primary-fixed-dim rounded-lg shrink-0">
                <Icon name="menu_book" size={20} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Bibit & Agronomi</h2>
                <p className="text-xs text-slate-300 mt-0.5">Jaminan bibit unggul & panduan ahli agronomi</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-8 pt-4 border-t border-white/10">
            <div>
              <div className="text-2xl font-bold text-white tracking-tight">12.500+</div>
              <div className="text-xs text-primary-fixed-dim/80">Petani & Pembudidaya</div>
            </div>
            <div className="h-8 w-px bg-white/15" />
            <div>
              <div className="text-2xl font-bold text-white tracking-tight">99.4%</div>
              <div className="text-xs text-primary-fixed-dim/80">Tingkat Keberhasilan Panen</div>
            </div>
            <div className="h-8 w-px bg-white/15" />
            <div>
              <div className="text-2xl font-bold text-white tracking-tight">34 Provinsi</div>
              <div className="text-xs text-primary-fixed-dim/80">Jangkauan Distribusi</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/50 flex items-center justify-between">
          <p>&copy; 2025 JagoFarm Agro Nusantara. Hak Cipta Dilindungi.</p>
          <div className="flex gap-4">
            <a className="hover:text-white transition-colors" href="#">Privasi</a>
            <a className="hover:text-white transition-colors" href="#">Ketentuan</a>
          </div>
        </div>
      </section>

      {/* Right Auth Section */}
      <section className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-12 xl:px-20 bg-white">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile back link */}
          <div className="lg:hidden mb-6 flex justify-between items-center">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary font-medium">
              <Icon name="arrow_back" size={14} />
              Kembali ke Beranda
            </Link>
            <span className="text-xs font-medium text-primary bg-surface-container-low px-2 py-0.5 rounded-full border border-outline-variant">
              JagoFarm v3.2
            </span>
          </div>

          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-white shadow-md shadow-primary/20 mb-4 ring-4 ring-emerald-50">
              <Icon name="eco" size={28} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Masuk ke JagoFarm</h2>
            <p className="text-sm text-slate-500 mt-1.5">
              Belum punya akun?{" "}
              <Link href="/register" className="text-primary font-semibold hover:underline">Daftar sekarang</Link>
            </p>
          </div>

          {notice && (
            <div className="mb-4 bg-surface-container-low text-primary text-sm p-3 rounded-xl border border-outline-variant">{notice}</div>
          )}
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-200">{error}</div>
          )}

          <div className="space-y-4">
            {/* Google Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-300 rounded-xl bg-white hover:bg-slate-50 hover:border-slate-400 text-slate-700 text-sm font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              Masuk dengan Google
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-6">
              <div className="border-t border-slate-200 w-full" />
              <div className="bg-white px-3 text-xs uppercase tracking-wider text-slate-400 font-medium">atau masuk dengan email</div>
              <div className="border-t border-slate-200 w-full" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Icon name="email" size={20} />
                  </div>
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Password</label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Icon name="lock" size={20} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-11 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    <Icon name={showPassword ? "visibility_off" : "visibility"} size={20} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center text-xs text-slate-600 cursor-pointer select-none">
                  <input type="checkbox" className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary" />
                  <span className="ml-2">Ingat saya</span>
                </label>
                <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                  Lupa password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary hover:bg-primary-container active:bg-emerald-950 text-white font-semibold text-sm transition-all shadow-md shadow-primary/20 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-60"
              >
                <span>{loading ? "Masuk..." : "Masuk ke Akun"}</span>
                {!loading && <Icon name="arrow_forward" size={16} />}
              </button>
            </form>
          </div>

          {/* Trust Badges */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Icon name="verified_user" size={16} className="text-primary shrink-0" />
              <span>Dilindungi enkripsi SSL 256-bit &bull; JagoFarm Ecosystem</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Dengan masuk, Anda menyetujui Ketentuan Layanan & Kebijakan Privasi JagoFarm.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="animate-pulse w-full min-h-screen bg-surface-container" />}>
      <LoginForm />
    </Suspense>
  );
}
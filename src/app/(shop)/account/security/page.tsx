"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";

export default function SecurityPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (newPassword !== confirmPassword) {
      toast({ title: "Password tidak cocok", description: "Konfirmasi password harus sama", variant: "destructive" });
      return;
    }
    // Konsisten dgn register & reset password (validators.ts): minimal 8.
    if (newPassword.length < 8) {
      toast({ title: "Password terlalu pendek", description: "Minimal 8 karakter", variant: "destructive" });
      return;
    }
    if (!currentPassword) {
      setFormError("Masukkan password saat ini untuk diverifikasi.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();

      // (1) Verifikasi password saat ini lebih dulu — email diambil dari sesi aktif.
      // Password baru TIDAK diubah sampai password saat ini terbukti benar.
      const { data: userData } = await supabase.auth.getUser();
      const email = userData?.user?.email;
      if (!email) {
        setFormError("Sesi login tidak ditemukan. Silakan masuk kembali.");
        return;
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (verifyError) {
        if (verifyError.code === "email_not_confirmed" || /confirm/i.test(verifyError.message)) {
          setFormError("Email belum dikonfirmasi. Cek inbox Anda dan coba lagi.");
        } else {
          setFormError("Password saat ini salah. Periksa kembali lalu coba lagi.");
        }
        return;
      }

      // (2) Setelah terverifikasi, baru ubah password.
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({ title: "Password berhasil diubah" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const message = err instanceof Error && err.message ? err.message : "Terjadi kesalahan";
      if (/session|jwt|refresh token|expired/i.test(message)) {
        setFormError("Sesi login Anda sudah berakhir. Silakan masuk kembali lalu coba lagi.");
      } else {
        toast({ title: "Gagal mengubah password", description: message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <section className="bg-primary text-on-primary py-12 md:py-16">
        <div className="max-w-2xl mx-auto px-margin text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-secondary-fixed-dim text-label-md font-label-md mb-4 backdrop-blur-sm">
            <span className="material-symbols-outlined text-[16px]">shield</span>
            <span>Keamanan</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg text-on-primary">Keamanan Akun</h1>
          <p className="text-body-md font-body-md text-primary-fixed-dim mt-2">Kelola password dan keamanan akun Anda</p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-2xl mx-auto px-margin py-8">
        {/* Change Password */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed/30 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">lock</span>
            </div>
            <div>
              <h2 className="text-headline-sm font-headline-sm text-on-surface">Ubah Password</h2>
              <p className="text-body-sm font-body-sm text-on-surface-variant">Perbarui password akun Anda secara berkala</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {formError && (
              <div role="alert" className="flex items-start gap-2 rounded-xl bg-error-container/30 text-error p-3 text-body-sm font-body-sm">
                <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                <span>{formError}</span>
              </div>
            )}
            <div>
              <label htmlFor="sec-current-password" className="text-label-md font-label-md text-on-surface mb-1.5 block">Password Saat Ini</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">lock</span>
                <input
                  id="sec-current-password"
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-surface-container-low hover:bg-surface-container border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-full pl-11 pr-12 py-2.5 text-body-md font-body-md text-on-surface placeholder:text-outline outline-none transition-colors"
                  placeholder="Masukkan password saat ini"
                  required
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} aria-label={showCurrent ? "Sembunyikan password" : "Tampilkan password"} aria-pressed={showCurrent} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded-full">
                  <span className="material-symbols-outlined text-[20px]">{showCurrent ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="sec-new-password" className="text-label-md font-label-md text-on-surface mb-1.5 block">Password Baru</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">lock_reset</span>
                <input
                  id="sec-new-password"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-surface-container-low hover:bg-surface-container border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-full pl-11 pr-12 py-2.5 text-body-md font-body-md text-on-surface placeholder:text-outline outline-none transition-colors"
                  placeholder="Minimal 8 karakter"
                  required
                  minLength={8}
                />
                <button type="button" onClick={() => setShowNew(!showNew)} aria-label={showNew ? "Sembunyikan password" : "Tampilkan password"} aria-pressed={showNew} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded-full">
                  <span className="material-symbols-outlined text-[20px]">{showNew ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="sec-confirm-password" className="text-label-md font-label-md text-on-surface mb-1.5 block">Konfirmasi Password Baru</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">lock</span>
                <input
                  id="sec-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-surface-container-low hover:bg-surface-container border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-full pl-11 pr-4 py-2.5 text-body-md font-body-md text-on-surface placeholder:text-outline outline-none transition-colors"
                  placeholder="Ulangi password baru"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-headline-sm py-3 rounded-full shadow-md transition-all active:scale-95 disabled:opacity-60"
            >
              {loading ? "Menyimpan..." : "Simpan Password Baru"}
            </button>
          </form>
        </div>

        {/* Security Tips */}
        <div className="mt-6 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
          <h3 className="text-headline-sm font-headline-sm text-on-surface mb-4">Tips Keamanan</h3>
          <div className="space-y-3">
            {([
              { icon: "password", text: "Gunakan kombinasi huruf, angka, dan simbol" },
              { icon: "key", text: "Jangan gunakan password yang sama di banyak situs" },
              { icon: "schedule", text: "Ubah password secara berkala (3-6 bulan)" },
              { icon: "phishing", text: "Jangan pernah bagikan password ke siapa pun" },
            ]).map((tip) => (
              <div key={tip.text} className="flex items-center gap-3 text-body-md font-body-md text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] text-primary shrink-0">{tip.icon}</span>
                {tip.text}
              </div>
            ))}
          </div>
        </div>

        {/* SSL Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-label-md font-label-md text-outline">
          <span className="material-symbols-outlined text-[16px] text-tertiary">verified_user</span>
          Dilindungi enkripsi SSL 256-bit
        </div>
      </section>
    </div>
  );
}
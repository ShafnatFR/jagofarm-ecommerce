"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";

export default function SecurityPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Password tidak cocok", description: "Konfirmasi password harus sama", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password terlalu pendek", description: "Minimal 6 karakter", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Password berhasil diubah" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      toast({ title: "Gagal mengubah password", description: err instanceof Error ? err.message : "Terjadi kesalahan", variant: "destructive" });
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
            <div>
              <label className="text-label-md font-label-md text-on-surface mb-1.5 block">Password Saat Ini</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">lock</span>
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-surface-container-low hover:bg-surface-container border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-full pl-11 pr-12 py-2.5 text-body-md font-body-md text-on-surface placeholder:text-outline outline-none transition-colors"
                  placeholder="Masukkan password saat ini"
                  required
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-primary">
                  <span className="material-symbols-outlined text-[20px]">{showCurrent ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-label-md font-label-md text-on-surface mb-1.5 block">Password Baru</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">lock_reset</span>
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-surface-container-low hover:bg-surface-container border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-full pl-11 pr-12 py-2.5 text-body-md font-body-md text-on-surface placeholder:text-outline outline-none transition-colors"
                  placeholder="Minimal 6 karakter"
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-primary">
                  <span className="material-symbols-outlined text-[20px]">{showNew ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-label-md font-label-md text-on-surface mb-1.5 block">Konfirmasi Password Baru</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">lock</span>
                <input
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
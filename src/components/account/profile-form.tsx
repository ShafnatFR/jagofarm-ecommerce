"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";

interface ProfileUser {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  role: string;
  createdAt?: string;
}

interface ProfileErrors {
  name?: string;
  phone?: string;
}

const SESSION_EXPIRED_MESSAGE =
  "Sesi login Anda sudah berakhir. Silakan masuk kembali lalu coba lagi.";

const MIN_PASSWORD_LENGTH = 8;

/**
 * Normalisasi nomor telepon Indonesia menjadi bentuk rapi:
 * - buang spasi/tanda pemisah (spasi, -, titik, kurung)
 * - `+62` / `62` / `+` di depan diubah menjadi `0`
 */
function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  let digits = trimmed.replace(/[^\d+]/g, "");
  if (digits.startsWith("+62")) digits = `0${digits.slice(3)}`;
  else if (digits.startsWith("62")) digits = `0${digits.slice(2)}`;
  else if (digits.startsWith("+")) digits = digits.slice(1);
  return digits;
}

/**
 * Validasi longgar untuk nomor Indonesia: kosong diperbolehkan, kalau diisi
 * cukup berupa 9-14 digit yang wajar (08123456789, 8123456789, atau +62...).
 */
function validatePhone(normalized: string): string | undefined {
  if (!normalized) return undefined;
  if (!/^(0\d{8,14}|8\d{8,13})$/.test(normalized)) {
    return "Nomor telepon tidak wajar. Contoh: 08123456789.";
  }
  return undefined;
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

/** true kalau pesan error Supabase menunjukkan sesi/JWT sudah tidak berlaku. */
function isSessionError(error: { message?: string; status?: number }): boolean {
  if (error.status === 401) return true;
  const message = error.message ?? "";
  return /session|jwt|refresh token|expired/i.test(message);
}

export function ProfileForm() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form profil
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    variant: "success" | "error";
    text: string;
  } | null>(null);

  // Ganti password
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    variant: "success" | "error";
    text: string;
  } | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/user/profile", { cache: "no-store" });
      if (res.status === 401) throw new Error(SESSION_EXPIRED_MESSAGE);
      if (!res.ok) throw new Error(`Gagal memuat profil (${res.status}).`);

      const data = await res.json();
      const profile = data?.user as ProfileUser | undefined;
      if (!profile) throw new Error("Respons profil tidak valid.");

      setUser(profile);
      setName(profile.name ?? "");
      setPhone(profile.phone ?? "");
    } catch (error) {
      setLoadError(errorMessage(error, "Gagal memuat profil."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pola fetch-saat-mount profil; setState ada di dalam helper loadProfile()
    void loadProfile();
  }, [loadProfile]);

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingProfile) return;

    const trimmedName = name.trim();
    const normalizedPhone = normalizePhone(phone);

    const nextErrors: ProfileErrors = {};
    if (trimmedName.length < 2) nextErrors.name = "Nama minimal 2 karakter.";
    const phoneError = validatePhone(normalizedPhone);
    if (phoneError) nextErrors.phone = phoneError;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setProfileMessage({
        variant: "error",
        text: "Periksa kembali data yang Anda isi.",
      });
      toast({
        variant: "destructive",
        title: "Data belum valid",
        description: "Periksa kembali nama dan nomor telepon Anda.",
      });
      return;
    }

    const unchanged =
      user !== null &&
      trimmedName === (user.name ?? "") &&
      normalizedPhone === normalizePhone(user.phone ?? "");
    if (unchanged) {
      setProfileMessage(null);
      toast({
        title: "Tidak ada perubahan",
        description: "Data profil Anda sudah sesuai.",
      });
      return;
    }

    setSavingProfile(true);
    setProfileMessage(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, phone: normalizedPhone }),
      });

      if (res.status === 401) throw new Error(SESSION_EXPIRED_MESSAGE);
      if (!res.ok) {
        let message = `Gagal menyimpan profil (${res.status}).`;
        try {
          const body = await res.json();
          if (typeof body?.error === "string" && body.error.trim()) {
            message = body.error;
          }
        } catch {
          // body bukan JSON — pakai pesan default
        }
        throw new Error(message);
      }

      const data = await res.json();
      const updated = (data?.user ?? null) as ProfileUser | null;
      const nextUser: ProfileUser = updated ?? {
        id: user?.id ?? "",
        email: user?.email ?? "",
        image: user?.image ?? null,
        role: user?.role ?? "customer",
        name: trimmedName,
        phone: normalizedPhone,
      };

      setUser(nextUser);
      setName(nextUser.name ?? "");
      setPhone(nextUser.phone ?? "");
      setProfileMessage({
        variant: "success",
        text: "Perubahan profil berhasil disimpan.",
      });
      toast({
        title: "Profil diperbarui",
        description: "Data akun Anda berhasil disimpan.",
      });
    } catch (error) {
      const message = errorMessage(error, "Gagal menyimpan profil.");
      setProfileMessage({ variant: "error", text: message });
      toast({
        variant: "destructive",
        title: "Gagal menyimpan profil",
        description: message,
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingPassword) return;

    if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordMessage({
        variant: "error",
        text: `Password baru minimal ${MIN_PASSWORD_LENGTH} karakter.`,
      });
      return;
    }
    if (password !== confirmPassword) {
      setPasswordMessage({
        variant: "error",
        text: "Konfirmasi password tidak cocok.",
      });
      return;
    }

    setSavingPassword(true);
    setPasswordMessage(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        const message = isSessionError(error)
          ? SESSION_EXPIRED_MESSAGE
          : error.message || "Gagal memperbarui password.";
        throw new Error(message);
      }

      setPassword("");
      setConfirmPassword("");
      setPasswordMessage({
        variant: "success",
        text: "Password berhasil diperbarui. Gunakan password baru saat masuk berikutnya.",
      });
      toast({
        title: "Password diperbarui",
        description: "Password akun Anda berhasil diganti.",
      });
    } catch (error) {
      const message = errorMessage(error, "Gagal memperbarui password.");
      setPasswordMessage({ variant: "error", text: message });
      toast({
        variant: "destructive",
        title: "Gagal memperbarui password",
        description: message,
      });
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-6 space-y-4">
          <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
          <div className="h-10 w-32 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-border bg-card p-6" role="alert">
        <div className="flex items-start gap-3">
          <Icon name="info" size={20} className="mt-0.5 shrink-0 text-destructive" />
          <div className="space-y-3">
            <div>
              <p className="font-semibold">Gagal memuat data profil</p>
              <p className="text-sm text-muted-foreground">{loadError}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => void loadProfile()}>
              <Icon name="refresh" size={16} className="mr-2" />
              Coba Lagi
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Icon name="person" size={20} className="text-primary" />
        <h3 className="text-lg font-semibold">Pengaturan Akun</h3>
      </div>

      <Tabs defaultValue="profil">
        <TabsList>
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="keamanan">Keamanan</TabsTrigger>
        </TabsList>

        {/* Profil */}
        <TabsContent value="profil">
          <form onSubmit={handleProfileSubmit} className="space-y-4 pt-4" noValidate>
            <div>
              <Input
                id="profile-email"
                label="Email"
                type="email"
                value={user?.email ?? ""}
                readOnly
                disabled
                className="bg-muted"
              />
              <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                <Icon name="mail" size={12} className="mt-0.5 shrink-0" />
                Email terikat pada akun login dan tidak dapat diubah dari halaman ini.
              </p>
            </div>

            <Input
              id="profile-name"
              label="Nama Lengkap"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nama lengkap Anda"
              autoComplete="name"
              error={errors.name}
              required
            />

            <div>
              <Input
                id="profile-phone"
                label="Nomor Telepon"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="08123456789"
                autoComplete="tel"
                error={errors.phone}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Opsional. Boleh dikosongkan. Format 08xx, +62xx, atau 8123xxxx akan
                dirapikan otomatis.
              </p>
            </div>

            {profileMessage && (
              <div
                role="status"
                aria-live="polite"
                className={
                  profileMessage.variant === "success"
                    ? "flex items-start gap-2 rounded-lg bg-primary/5 p-3 text-sm text-primary"
                    : "flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                }
              >
                {profileMessage.variant === "success" ? (
                  <Icon name="check_circle" size={16} className="mt-0.5 shrink-0" />
                ) : (
                  <Icon name="info" size={16} className="mt-0.5 shrink-0" />
                )}
                <span>{profileMessage.text}</span>
              </div>
            )}

            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? (
                <>
                  <Icon name="progress_activity" size={16} className="mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </form>
        </TabsContent>

        {/* Keamanan */}
        <TabsContent value="keamanan">
          <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-4" noValidate>
            <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <Icon name="shield" size={16} className="mt-0.5 shrink-0 text-primary" />
              <span>
                Gunakan password minimal {MIN_PASSWORD_LENGTH} karakter. Password baru
                langsung berlaku untuk login berikutnya.
              </span>
            </div>

            <Input
              id="new-password"
              label="Password Baru"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={`Minimal ${MIN_PASSWORD_LENGTH} karakter`}
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
            />

            <Input
              id="confirm-password"
              label="Konfirmasi Password Baru"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Ulangi password baru"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
            />

            {passwordMessage && (
              <div
                role="status"
                aria-live="polite"
                className={
                  passwordMessage.variant === "success"
                    ? "flex items-start gap-2 rounded-lg bg-primary/5 p-3 text-sm text-primary"
                    : "flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                }
              >
                {passwordMessage.variant === "success" ? (
                  <Icon name="check_circle" size={16} className="mt-0.5 shrink-0" />
                ) : (
                  <Icon name="info" size={16} className="mt-0.5 shrink-0" />
                )}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <Button type="submit" disabled={savingPassword}>
              {savingPassword ? (
                <>
                  <Icon name="progress_activity" size={16} className="mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Icon name="key" size={16} className="mr-2" />
                  Ganti Password
                </>
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ProfileForm;

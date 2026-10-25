"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { ProfileForm } from "@/components/account/profile-form";
import { useToast } from "@/components/ui/use-toast";
import { UPLOAD } from "@/lib/constants";

const ACCEPTED_TYPES = new Set(UPLOAD.ACCEPTED_IMAGE_TYPES.map((t) => t.toLowerCase()));
const ACCEPTED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

/** Inisial 1-2 huruf ala Google: "Shafnat Fuaini" → "SF", "Shafnat" → "S". */
function getInitials(nameOrEmail: string): string {
  const name = nameOrEmail.split("@")[0].replace(/[._-]+/g, " ").trim();
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AccountUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  phone: string | null;
  role: string;
  createdAt: string;
  ordersCount: number;
  addressesCount: number;
}

export default function AccountPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const [profileRes, addressesRes] = await Promise.all([
          fetch("/api/user/profile", { cache: "no-store" }),
          fetch("/api/user/addresses", { cache: "no-store" }),
        ]);

        if (profileRes.status === 401 || addressesRes.status === 401) {
          router.replace("/login");
          return;
        }
        if (!profileRes.ok || !addressesRes.ok) {
          throw new Error(`Gagal memuat data akun (${profileRes.status || addressesRes.status}).`);
        }

        const profilePayload = await profileRes.json();
        const addressesPayload = await addressesRes.json();

        const profile = profilePayload?.user;
        if (!profile) throw new Error("Respons profil tidak valid.");

        if (!cancelled) {
          setUser({
            id: profile.id,
            name: profile.name ?? null,
            email: profile.email,
            image: profile.image ?? null,
            phone: profile.phone ?? null,
            role: profile.role ?? "customer",
            createdAt: profile.createdAt,
            ordersCount: profile._count?.orders ?? 0,
            addressesCount: Array.isArray(addressesPayload?.addresses)
              ? addressesPayload.addresses.length
              : 0,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error && error.message ? error.message : "Gagal memuat data akun.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [router, reloadNonce]);

  const openPicker = () => {
    if (!uploading) fileInputRef.current?.click();
  };

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    // Reset agar file yang sama bisa dipilih ulang.
    event.target.value = "";
    if (!file) return;

    const type = file.type?.toLowerCase?.() ?? "";
    const ext = (file.name.split(".").pop() || "").toLowerCase();

    if (!ACCEPTED_TYPES.has(type) && !ACCEPTED_EXTENSIONS.has(ext)) {
      toast({
        title: "Format tidak didukung",
        description: "Gunakan gambar JPEG, PNG, atau WebP.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > UPLOAD.MAX_FILE_SIZE) {
      toast({
        title: "Ukuran terlalu besar",
        description: `Maksimal ${(UPLOAD.MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)} MB.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/user/avatar", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || `Gagal mengunggah foto (HTTP ${res.status}).`);
      }
      setUser((current) => (current ? { ...current, image: data.url as string } : current));
      router.refresh();
      toast({ title: "Foto profil diperbarui" });
    } catch (error) {
      toast({
        title: "Gagal mengunggah foto",
        description: error instanceof Error && error.message ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="mb-8 space-y-2">
          <div className="h-4 w-48 bg-surface-container rounded animate-pulse" />
          <div className="h-8 w-64 bg-surface-container rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4">
            <div className="h-72 bg-white rounded-2xl border border-outline-variant/80 shadow-md animate-pulse" />
          </div>
          <div className="lg:col-span-8">
            <div className="h-96 bg-white rounded-2xl border border-outline-variant/80 shadow-md animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <Icon name="info" size={48} className="mx-auto text-error" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Gagal Memuat Akun</h1>
        <p className="mt-2 text-slate-500">{loadError}</p>
        <button
          type="button"
          onClick={() => setReloadNonce((n) => n + 1)}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold shadow-md shadow-primary/20 transition-all"
        >
          <Icon name="refresh" size={16} />
          Coba Lagi
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <p className="text-sm text-slate-500">Mengalihkan ke halaman masuk...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      {/* Breadcrumb and Page Title */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
          <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
          <span>/</span>
          <Link href="/account" className="hover:text-primary transition-colors">Akun Saya</Link>
          <span>/</span>
          <span className="text-on-surface font-medium">Profil</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">Profil Saya</h1>
        <p className="text-sm text-on-surface-variant mt-1">Kelola data informasi akun, preferensi keamanan, dan tinjau riwayat pesanan Anda.</p>
      </div>

      {/* Layout Grid: Left Sidebar & Right Form/Stats Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: User Profile Card & Account Menu */}
        <div className="lg:col-span-4 space-y-6">
          {/* Main User Summary Card */}
          <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-outline-variant shadow-md text-center relative overflow-hidden">
            {/* Subtle decorative background accent */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            {/* Avatar */}
            <div className="relative mx-auto w-28 h-28 mb-5">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || "Profile"}
                  width={112}
                  height={112}
                  className="w-full h-full rounded-full object-cover border-4 border-surface shadow-md"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-surface-container-high flex items-center justify-center text-4xl font-extrabold text-primary border-4 border-surface shadow-md">
                  {getInitials(user.name || user.email)}
                </div>
              )}
              <button
                className="absolute bottom-1 right-1 p-2 bg-primary text-on-primary rounded-full shadow hover:brightness-110 transition-all scale-95 hover:scale-105 disabled:opacity-60"
                title="Ubah Foto Profil"
                type="button"
                aria-label="Ubah Foto Profil"
                onClick={openPicker}
                disabled={uploading}
              >
                <Icon name={uploading ? "progress_activity" : "photo_camera"} size={16} className={uploading ? "animate-spin" : undefined} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={UPLOAD.ACCEPTED_IMAGE_TYPES.join(",")}
                className="hidden"
                disabled={uploading}
                onChange={handleAvatarChange}
              />
            </div>
            {/* User Details */}
            <h2 className="font-serif text-2xl font-bold text-on-surface">{user.name || "Tanpa Nama"}</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">{user.email}</p>
            <div className="mt-3.5 flex items-center justify-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-surface-container text-primary dark:text-tertiary border border-outline-variant">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                {user.role === "admin" ? "Admin" : "Pelanggan"}
              </span>
            </div>
            <div className="mt-6 pt-5 border-t border-outline-variant flex items-center justify-center gap-2 text-xs text-on-surface-variant">
              <Icon name="calendar_today" size={16} />
              <span>Bergabung sejak {formatDate(user.createdAt)}</span>
            </div>
          </div>

          {/* Quick Side Navigation Menu */}
          <div className="bg-surface rounded-2xl border border-outline-variant p-2 shadow-md">
            <Link
              href="/account"
              className="flex items-center justify-between p-3 rounded-xl bg-surface-container text-primary dark:text-tertiary font-semibold text-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-primary/10 text-primary dark:text-tertiary">
                  <Icon name="person" size={16} />
                </span>
                <span>Informasi Profil</span>
              </div>
              <Icon name="chevron_right" size={16} />
            </Link>
            <Link
              href="/account/addresses"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container text-on-surface-variant hover:text-on-surface font-medium text-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-surface-container text-on-surface-variant">
                  <Icon name="location_on" size={16} />
                </span>
                <span>Daftar Alamat Pengiriman</span>
              </div>
              <Icon name="chevron_right" size={16} className="text-on-surface-variant/50" />
            </Link>
            <Link
              href="/orders"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container text-on-surface-variant hover:text-on-surface font-medium text-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-surface-container text-on-surface-variant">
                  <Icon name="receipt_long" size={16} />
                </span>
                <span>Riwayat Transaksi &amp; Pesanan</span>
              </div>
              <Icon name="chevron_right" size={16} className="text-on-surface-variant/50" />
            </Link>
            <Link
              href="/auth/signout"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-error-container/20 text-on-surface-variant hover:text-error font-medium text-sm transition-all mt-1"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-error-container/20 text-error">
                  <Icon name="logout" size={16} />
                </span>
                <span>Keluar dari Akun</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Right Column: Settings Form, Stats & Quick Actions */}
        <div className="lg:col-span-8 space-y-8">
          {/* SECTION 1: Account Settings Form */}
          <ProfileForm />

          {/* SECTION 2: Statistik Ringkas Akun */}
          <div className="bg-surface rounded-2xl border border-outline-variant p-6 sm:p-8 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-2xl font-bold text-on-surface flex items-center gap-2">
                <Icon name="bar_chart" size={22} className="text-primary dark:text-tertiary" />
                Statistik Akun
              </h3>
              <span className="text-xs font-medium text-on-surface-variant">Ringkasan aktivitas terkini</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Metric 1: Pesanan */}
              <div className="bg-surface-container-low hover:bg-surface-container transition-colors border border-outline-variant rounded-2xl p-6 text-center group">
                <div className="w-12 h-12 mx-auto rounded-full bg-surface border border-outline-variant shadow-sm flex items-center justify-center text-primary dark:text-tertiary mb-3 group-hover:scale-110 transition-transform">
                  <Icon name="shopping_bag" size={24} />
                </div>
                <span className="block font-serif text-4xl font-extrabold text-on-surface group-hover:text-primary dark:group-hover:text-tertiary transition-colors">
                  {user.ordersCount}
                </span>
                <span className="text-sm font-medium text-on-surface-variant mt-1 block">Pesanan</span>
              </div>
              {/* Metric 2: Alamat Tersimpan */}
              <div className="bg-surface-container-low hover:bg-surface-container transition-colors border border-outline-variant rounded-2xl p-6 text-center group">
                <div className="w-12 h-12 mx-auto rounded-full bg-surface border border-outline-variant shadow-sm flex items-center justify-center text-primary dark:text-tertiary mb-3 group-hover:scale-110 transition-transform">
                  <Icon name="location_on" size={24} />
                </div>
                <span className="block font-serif text-4xl font-extrabold text-on-surface group-hover:text-primary dark:group-hover:text-tertiary transition-colors">
                  {user.addressesCount}
                </span>
                <span className="text-sm font-medium text-on-surface-variant mt-1 block">Alamat Tersimpan</span>
              </div>
            </div>
          </div>

          {/* SECTION 3: Aksi Cepat (Quick Actions) */}
          <div className="bg-surface rounded-2xl border border-outline-variant p-6 sm:p-8 shadow-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif text-2xl font-bold text-on-surface flex items-center gap-2">
                <Icon name="bolt" size={22} className="text-primary dark:text-tertiary" />
                Aksi Cepat
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/account/addresses"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant hover:border-primary hover:bg-surface-container text-on-surface-variant hover:text-primary dark:hover:text-tertiary text-sm font-semibold transition-all shadow-sm"
              >
                <Icon name="location_on" size={16} />
                Kelola Alamat
              </Link>
              <Link
                href="/orders"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant hover:border-primary hover:bg-surface-container text-on-surface-variant hover:text-primary dark:hover:text-tertiary text-sm font-semibold transition-all shadow-sm"
              >
                <Icon name="receipt_long" size={16} />
                Lihat Pesanan
              </Link>
              <Link
                href="/wishlist"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant hover:border-primary hover:bg-surface-container text-on-surface-variant hover:text-primary dark:hover:text-tertiary text-sm font-semibold transition-all shadow-sm"
              >
                <Icon name="favorite" size={16} />
                Wishlist Saya
              </Link>
              <Link
                href="/account/security"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant hover:border-primary hover:bg-surface-container text-on-surface-variant hover:text-primary dark:hover:text-tertiary text-sm font-semibold transition-all shadow-sm"
              >
                <Icon name="shield" size={16} />
                Keamanan
              </Link>
              <Link
                href="/account/transactions"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant hover:border-primary hover:bg-surface-container text-on-surface-variant hover:text-primary dark:hover:text-tertiary text-sm font-semibold transition-all shadow-sm"
              >
                <Icon name="receipt_long" size={16} />
                Riwayat Transaksi
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold shadow-md hover:brightness-110 transition-all hover:scale-105 active:scale-95"
              >
                <Icon name="shopping_bag" size={16} />
                Belanja Lagi
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}

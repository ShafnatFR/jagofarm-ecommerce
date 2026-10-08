import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { ProfileForm } from "@/components/account/profile-form";

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      phone: true,
      role: true,
      createdAt: true,
      _count: {
        select: { orders: true, addresses: true },
      },
    },
  });

  if (!dbUser) {
    redirect("/login");
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      {/* Breadcrumb and Page Title */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
          <span>/</span>
          <Link href="/account" className="hover:text-primary transition-colors">Akun Saya</Link>
          <span>/</span>
          <span className="text-on-surface-variant font-medium">Profil</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Profil Saya</h1>
        <p className="text-sm text-slate-500 mt-1">Kelola data informasi akun, preferensi keamanan, dan tinjau riwayat pesanan Anda.</p>
      </div>

      {/* Layout Grid: Left Sidebar & Right Form/Stats Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: User Profile Card & Account Menu */}
        <div className="lg:col-span-4 space-y-6">
          {/* Main User Summary Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-outline-variant/80 shadow-md text-center relative overflow-hidden">
            {/* Subtle decorative background accent */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-primary-fixed/20 rounded-full blur-2xl pointer-events-none" />
            {/* Avatar */}
            <div className="relative mx-auto w-28 h-28 mb-5">
              {dbUser.image ? (
                <Image
                  src={dbUser.image}
                  alt={dbUser.name || "Profile"}
                  width={112}
                  height={112}
                  className="w-full h-full rounded-full object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-fixed/30 via-tertiary-fixed/20 to-outline-variant flex items-center justify-center text-4xl font-extrabold text-primary border-4 border-white shadow-md">
                  {dbUser.name?.[0]?.toUpperCase() || dbUser.email[0].toUpperCase()}
                </div>
              )}
              <button
                className="absolute bottom-1 right-1 p-2 bg-primary text-white rounded-full shadow hover:bg-primary/90 transition-all scale-95 hover:scale-105"
                title="Ubah Foto Profil"
                type="button"
              >
                <Icon name="photo_camera" size={16} />
              </button>
            </div>
            {/* User Details */}
            <h2 className="text-xl font-bold text-slate-800">{dbUser.name || "Tanpa Nama"}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{dbUser.email}</p>
            <div className="mt-3.5 flex items-center justify-center gap-2">
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-primary-fixed/20 text-primary border border-outline-variant">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5" />
                {dbUser.role === "admin" ? "Admin" : "Pelanggan"}
              </span>
            </div>
            <div className="mt-6 pt-5 border-t border-outline-variant flex items-center justify-center gap-2 text-xs text-slate-400">
              <Icon name="calendar_today" size={16} />
              <span>Bergabung sejak {formatDate(dbUser.createdAt)}</span>
            </div>
          </div>

          {/* Quick Side Navigation Menu */}
          <div className="bg-white rounded-2xl border border-outline-variant/80 p-2 shadow-md">
            <Link
              href="/account"
              className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low text-primary font-semibold text-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-primary-fixed/20 text-primary">
                  <Icon name="person" size={16} />
                </span>
                <span>Informasi Profil</span>
              </div>
              <Icon name="chevron_right" size={16} />
            </Link>
            <Link
              href="/account/addresses"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-medium text-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-slate-100 text-slate-500">
                  <Icon name="location_on" size={16} />
                </span>
                <span>Daftar Alamat Pengiriman</span>
              </div>
              <Icon name="chevron_right" size={16} className="text-slate-400" />
            </Link>
            <Link
              href="/orders"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-medium text-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-slate-100 text-slate-500">
                  <Icon name="receipt_long" size={16} />
                </span>
                <span>Riwayat Transaksi &amp; Pesanan</span>
              </div>
              <Icon name="chevron_right" size={16} className="text-slate-400" />
            </Link>
            <Link
              href="/auth/signout"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-red-50 text-slate-600 hover:text-rose-600 font-medium text-sm transition-all mt-1"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-rose-50 text-rose-500">
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
          <div className="bg-white rounded-2xl border border-outline-variant/80 p-6 sm:p-8 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Icon name="bar_chart" size={20} className="text-primary" />
                Statistik Akun
              </h3>
              <span className="text-xs font-medium text-slate-400">Ringkasan aktivitas terkini</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Metric 1: Pesanan */}
              <div className="bg-surface-container-lowest hover:bg-surface-container-low/40 transition-colors border border-outline-variant rounded-2xl p-6 text-center group">
                <div className="w-12 h-12 mx-auto rounded-full bg-white shadow-sm flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform">
                  <Icon name="shopping_bag" size={24} />
                </div>
                <span className="block text-4xl font-extrabold text-slate-900 group-hover:text-primary transition-colors">
                  {dbUser._count.orders}
                </span>
                <span className="text-sm font-medium text-slate-500 mt-1 block">Pesanan</span>
              </div>
              {/* Metric 2: Alamat Tersimpan */}
              <div className="bg-surface-container-lowest hover:bg-surface-container-low/40 transition-colors border border-outline-variant rounded-2xl p-6 text-center group">
                <div className="w-12 h-12 mx-auto rounded-full bg-white shadow-sm flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform">
                  <Icon name="location_on" size={24} />
                </div>
                <span className="block text-4xl font-extrabold text-slate-900 group-hover:text-primary transition-colors">
                  {dbUser._count.addresses}
                </span>
                <span className="text-sm font-medium text-slate-500 mt-1 block">Alamat Tersimpan</span>
              </div>
            </div>
          </div>

          {/* SECTION 3: Aksi Cepat (Quick Actions) */}
          <div className="bg-white rounded-2xl border border-outline-variant/80 p-6 sm:p-8 shadow-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Icon name="bolt" size={20} className="text-primary" />
                Aksi Cepat
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/account/addresses"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant hover:border-primary hover:bg-surface-container-low/50 text-on-surface-variant hover:text-primary text-sm font-semibold transition-all shadow-sm"
              >
                <Icon name="location_on" size={16} className="text-slate-500" />
                Kelola Alamat
              </Link>
              <Link
                href="/orders"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant hover:border-primary hover:bg-surface-container-low/50 text-on-surface-variant hover:text-primary text-sm font-semibold transition-all shadow-sm"
              >
                <Icon name="receipt_long" size={16} className="text-slate-500" />
                Lihat Pesanan
              </Link>
              <Link
                href="/wishlist"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant hover:border-primary hover:bg-surface-container-low/50 text-on-surface-variant hover:text-primary text-sm font-semibold transition-all shadow-sm"
              >
                <Icon name="favorite" size={16} className="text-slate-500" />
                Wishlist Saya
              </Link>
              <Link
                href="/account/security"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant hover:border-primary hover:bg-surface-container-low/50 text-on-surface-variant hover:text-primary text-sm font-semibold transition-all shadow-sm"
              >
                <Icon name="shield" size={16} className="text-slate-500" />
                Keamanan
              </Link>
              <Link
                href="/account/transactions"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant hover:border-primary hover:bg-surface-container-low/50 text-on-surface-variant hover:text-primary text-sm font-semibold transition-all shadow-sm"
              >
                <Icon name="receipt_long" size={16} className="text-slate-500" />
                Riwayat Transaksi
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold shadow-md shadow-primary/20 transition-all hover:scale-105 active:scale-95"
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
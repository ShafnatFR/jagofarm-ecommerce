import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profil Saya</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <div className="bg-card p-6 rounded-lg border border-border text-center">
            {dbUser.image ? (
              <Image
                src={dbUser.image}
                alt={dbUser.name || "Profile"}
                width={100}
                height={100}
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-primary/10 flex items-center justify-center">
                <span className="text-3xl font-bold text-primary">
                  {dbUser.name?.[0]?.toUpperCase() || dbUser.email[0].toUpperCase()}
                </span>
              </div>
            )}
            <h2 className="text-xl font-semibold">{dbUser.name || "Tanpa Nama"}</h2>
            <p className="text-sm text-muted-foreground">{dbUser.email}</p>
            <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
              {dbUser.role === "admin" ? "Admin" : dbUser.role === "staff" ? "Staff" : "Pelanggan"}
            </span>
            <p className="mt-3 text-xs text-muted-foreground">
              Bergabung sejak {formatDate(dbUser.createdAt)}
            </p>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <ProfileForm />

          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-lg font-semibold mb-4">Statistik</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{dbUser._count.orders}</p>
                <p className="text-sm text-muted-foreground">Pesanan</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{dbUser._count.addresses}</p>
                <p className="text-sm text-muted-foreground">Alamat Tersimpan</p>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-lg font-semibold mb-4">Aksi Cepat</h3>
            <div className="flex flex-wrap gap-4">
              <a
                href="/account/addresses"
                className="px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 border border-primary rounded-lg hover:bg-primary/5 transition-colors"
              >
                Kelola Alamat
              </a>
              <Link
                href="/orders"
                className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Lihat Pesanan
              </Link>
              <a
                href="/wishlist"
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-foreground hover:text-primary border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <Heart className="h-4 w-4" />
                Wishlist Saya
              </a>
              <Link
                href="/products"
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Belanja Lagi
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
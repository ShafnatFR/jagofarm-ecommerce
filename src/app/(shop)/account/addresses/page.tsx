import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AddressesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Alamat Saya</h1>
        <Link
          href="/account/addresses/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          + Tambah Alamat Baru
        </Link>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-card p-8 rounded-lg border border-border text-center">
          <p className="text-muted-foreground mb-4">Belum ada alamat tersimpan</p>
          <Link
            href="/account/addresses/new"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors inline-block"
          >
            Tambah Alamat Pertama
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="bg-card p-6 rounded-lg border border-border relative"
            >
              {address.isDefault && (
                <span className="absolute top-4 right-4 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Utama
                </span>
              )}
              <h3 className="font-semibold mb-2">{address.label}</h3>
              <p className="text-sm text-muted-foreground mb-1">
                {address.recipientName}
              </p>
              <p className="text-sm text-muted-foreground mb-1">
                {address.phone}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {address.street}, {address.city}, {address.province} {address.postalCode}
              </p>
              <div className="flex gap-2">
                <Link
                  href={`/account/addresses/${address.id}/edit`}
                  className="flex-1 px-3 py-1.5 text-sm text-primary hover:text-primary/80 border border-primary rounded-lg text-center transition-colors"
                >
                  Edit
                </Link>
                <form action={`/api/user/addresses/${address.id}/default`} method="POST">
                  <button
                    type="submit"
                    className="flex-1 px-3 py-1.5 text-sm text-foreground hover:text-primary border border-border rounded-lg text-center transition-colors"
                    disabled={address.isDefault}
                  >
                    {address.isDefault ? "Sudah Utama" : "Jadikan Utama"}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
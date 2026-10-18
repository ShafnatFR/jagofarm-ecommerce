import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AddressesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await searchParams;

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface">Alamat Saya</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">Kelola daftar alamat untuk kemudahan checkout &amp; pengiriman.</p>
        </div>
        <Link
          href="/account/addresses/new"
          className="px-4 py-2.5 bg-primary text-on-primary rounded-xl hover:brightness-110 transition-all text-sm font-semibold shadow-sm"
        >
          + Tambah Alamat Baru
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : null}

      {addresses.length === 0 ? (
        <div className="bg-surface p-10 rounded-2xl border border-outline-variant text-center shadow-sm">
          <p className="text-on-surface-variant mb-4 text-sm">Belum ada alamat tersimpan</p>
          <Link
            href="/account/addresses/new"
            className="px-5 py-2.5 bg-primary text-on-primary rounded-xl hover:brightness-110 transition-all text-sm font-semibold inline-block shadow-sm"
          >
            Tambah Alamat Pertama
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="bg-surface p-6 rounded-2xl border border-outline-variant relative shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="font-serif text-lg font-bold text-on-surface">{address.label}</h3>
                  {address.isDefault && (
                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-primary/15 text-primary dark:text-tertiary border border-outline-variant rounded-full">
                      Utama
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-on-surface mb-1">
                  {address.recipientName}
                </p>
                <p className="text-xs text-on-surface-variant mb-1">
                  {address.phone}
                </p>
                <p className="text-xs text-on-surface-variant/90 mb-4 leading-relaxed">
                  {address.detail}, {address.city}, {address.province} {address.postalCode}
                </p>
              </div>
              <div className="flex gap-2 pt-2 border-t border-outline-variant">
                <Link
                  href={`/account/addresses/${address.id}/edit`}
                  className="flex-1 px-3 py-1.5 text-xs font-semibold text-primary dark:text-tertiary hover:bg-surface-container border border-outline-variant rounded-xl text-center transition-colors"
                >
                  Edit
                </Link>
                <form action={`/api/user/addresses/${address.id}/default`} method="POST" className="flex-1">
                  <button
                    type="submit"
                    className="w-full px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container border border-outline-variant rounded-xl text-center transition-colors disabled:opacity-50"
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
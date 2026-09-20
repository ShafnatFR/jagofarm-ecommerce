import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function EditAddressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  const { id } = await params;

  if (!user) {
    redirect("/login");
  }

  const address = await prisma.address.findFirst({
    where: { id, userId: user.id },
  });

  if (!address) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Alamat</h1>
        <Link
          href="/account/addresses"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Kembali
        </Link>
      </div>

      <form action={`/api/user/addresses/${id}`} method="POST" className="space-y-6">
        <input type="hidden" name="_method" value="PATCH" />

        <div className="bg-card p-6 rounded-lg border border-border space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Detail Alamat</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="label" className="block text-sm font-medium mb-1">
                Label Alamat <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="label"
                name="label"
                required
                defaultValue={address.label}
                placeholder="Contoh: Rumah, Kantor, Orang Tua"
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="recipientName" className="block text-sm font-medium mb-1">
                Nama Penerima <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="recipientName"
                name="recipientName"
                required
                defaultValue={address.recipientName}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1">
                No. Telepon <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                defaultValue={address.phone}
                placeholder="08xxxxxxxxxx"
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="street" className="block text-sm font-medium mb-1">
              Alamat Lengkap <span className="text-red-500">*</span>
            </label>
            <textarea
              id="street"
              name="street"
              required
              rows={3}
              defaultValue={address.detail || ""}
              placeholder="Jalan, Nomor, RT/RW, Kelurahan"
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className="block text-sm font-medium mb-1">
                Kota/Kabupaten <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="city"
                name="city"
                required
                defaultValue={address.city}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="district" className="block text-sm font-medium mb-1">
                Kecamatan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="district"
                name="district"
                required
                defaultValue={address.district}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="province" className="block text-sm font-medium mb-1">
                Provinsi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="province"
                name="province"
                required
                defaultValue={address.province}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium mb-1">
                Kode Pos <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                required
                pattern="[0-9]{5}"
                defaultValue={address.postalCode}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              name="isDefault"
              value="true"
              defaultChecked={address.isDefault}
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
            />
            <label htmlFor="isDefault" className="text-sm">
              Jadikan alamat utama
            </label>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Simpan Perubahan
          </button>
          <Link
            href="/account/addresses"
            className="flex-1 px-4 py-2 text-center text-foreground hover:text-primary border border-border rounded-lg hover:bg-muted transition-colors font-medium"
          >
            Batal
          </Link>
        </div>
      </form>

      <form
        action={`/api/user/addresses/${id}`}
        method="POST"
        className="border-t pt-6"
        onSubmit={(e) => {
          if (!confirm("Hapus alamat ini? Tindakan ini tidak dapat dibatalkan.")) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="_method" value="DELETE" />
        <button
          type="submit"
          className="w-full px-4 py-2 text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors font-medium"
        >
          Hapus Alamat
        </button>
      </form>
    </div>
  );
}
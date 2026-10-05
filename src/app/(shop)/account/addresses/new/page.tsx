import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AddressForm } from "@/components/account/address-form";

export default async function NewAddressPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const [existingCount, profile] = await Promise.all([
    prisma.address.count({ where: { userId: user.id } }),
    prisma.user.findUnique({ where: { id: user.id }, select: { name: true, phone: true } }),
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tambah Alamat Baru</h1>
        <Link href="/account/addresses" className="text-sm text-muted-foreground hover:text-foreground">← Kembali</Link>
      </div>
      <AddressForm
        existingCount={existingCount}
        initialValues={{ recipientName: profile?.name ?? user.name ?? "", phone: profile?.phone ?? "" }}
      />
    </div>
  );
}

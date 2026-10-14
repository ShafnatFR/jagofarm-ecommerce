import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Hanya field alamat yang boleh diubah (cegah mass-assignment: userId, id, dsb).
const patchAddressSchema = z
  .object({
    label: z.string().min(1, "Label alamat wajib diisi").max(50),
    recipientName: z.string().min(2, "Nama penerima minimal 2 karakter").max(100),
    phone: z
      .string()
      .min(10, "Nomor telepon minimal 10 digit")
      .max(20)
      .regex(/^[0-9+\-\s()]+$/, "Format nomor telepon tidak valid"),
    province: z.string().min(1, "Provinsi wajib diisi").max(100),
    provinceId: z.string().max(20).optional().or(z.literal("")),
    city: z.string().min(1, "Kota/kabupaten wajib diisi").max(100),
    cityId: z.string().max(20).optional().or(z.literal("")),
    district: z.string().max(100).optional(),
    districtId: z.string().max(20).optional().or(z.literal("")),
    postalCode: z.string().regex(/^[0-9]{5}$/, "Kode pos harus 5 digit angka"),
    detail: z.string().max(500).optional().or(z.literal("")),
    isDefault: z.boolean().optional(),
  })
  .partial();

/** Ubah address milik user. `data` sudah tervalidasi (partial). */
async function updateAddress(
  userId: string,
  id: string,
  data: z.infer<typeof patchAddressSchema>
) {
  const address = await prisma.address.findFirst({ where: { id, userId } });
  if (!address) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.address.update({ where: { id }, data });
  return NextResponse.json({ message: "Address updated", address: updated });
}

/** Hapus address milik user (dengan aturan: tidak boleh jika dipakai order). */
async function deleteAddress(userId: string, id: string) {
  const address = await prisma.address.findFirst({ where: { id, userId } });
  if (!address) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  const usedInOrder = await prisma.order.findFirst({
    where: { shippingAddressId: id },
  });
  if (usedInOrder) {
    return NextResponse.json(
      { error: "Alamat tidak bisa dihapus karena sudah dipakai di pesanan." },
      { status: 400 }
    );
  }

  await prisma.address.delete({ where: { id } });

  if (address.isDefault) {
    const nextAddress = await prisma.address.findFirst({
      where: { userId },
      orderBy: { id: "asc" },
    });
    if (nextAddress) {
      await prisma.address.update({
        where: { id: nextAddress.id },
        data: { isDefault: true },
      });
    }
  }

  return NextResponse.json({ message: "Address deleted" });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const parsed = patchAddressSchema.safeParse(body);
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
      return NextResponse.json(
        { error: first ?? "Data alamat tidak valid." },
        { status: 400 }
      );
    }

    return await updateAddress(session.user.id, id, parsed.data);
  } catch (error) {
    console.error("Address PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    return await deleteAddress(session.user.id, id);
  } catch (error) {
    console.error("Address DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Handler POST untuk form HTML non-JS (progressive enhancement).
 * Form mengirim application/x-www-form-urlencoded dengan hidden `_method`
 * (PATCH/DELETE). Tanpa ini, submit form akan kena 405 Method Not Allowed.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const form = await request.formData();
    const method = String(form.get("_method") ?? "PATCH").toUpperCase();

    if (method === "DELETE") {
      const result = await deleteAddress(session.user.id, id);
      if (result.status >= 400) {
        const url = new URL(`/account/addresses/${id}/edit`, request.url);
        const body = await result.json().catch(() => ({}));
        url.searchParams.set("error", body?.error ?? "Gagal menghapus alamat.");
        return NextResponse.redirect(url, 303);
      }
      return NextResponse.redirect(new URL("/account/addresses", request.url), 303);
    }

    // Petakan field form -> schema (form memakai `street`, DB memakai `detail`).
    const raw: Record<string, unknown> = {};
    for (const [key, value] of form.entries()) {
      if (key === "_method") continue;
      raw[key] = typeof value === "string" ? value : value.name;
    }
    if (typeof raw.street === "string" && raw.detail === undefined) {
      raw.detail = raw.street;
    }
    delete raw.street;
    // Checkbox: ada ("true") -> true, tidak ada -> false.
    raw.isDefault = form.get("isDefault") !== null;

    const parsed = patchAddressSchema.safeParse(raw);
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
      const url = new URL(`/account/addresses/${id}/edit`, request.url);
      url.searchParams.set("error", first ?? "Data alamat tidak valid.");
      return NextResponse.redirect(url, 303);
    }

    const result = await updateAddress(session.user.id, id, parsed.data);
    if (result.status >= 400) {
      const url = new URL(`/account/addresses/${id}/edit`, request.url);
      const body = await result.json().catch(() => ({}));
      url.searchParams.set("error", body?.error ?? "Gagal menyimpan alamat.");
      return NextResponse.redirect(url, 303);
    }
    // Form HTML native: redirect balik ke daftar alamat setelah sukses.
    return NextResponse.redirect(new URL("/account/addresses", request.url), 303);
  } catch (error) {
    console.error("Address POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

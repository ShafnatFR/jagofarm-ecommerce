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
    const data = parsed.data;

    // Verify ownership
    const address = await prisma.address.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    // If setting as default, unset others
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data,
    });

    return NextResponse.json({ message: "Address updated", address: updated });
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

    // Verify ownership
    const address = await prisma.address.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    // Check if used in orders
    const usedInOrder = await prisma.order.findFirst({
      where: { shippingAddressId: id },
    });
    if (usedInOrder) {
      return NextResponse.json(
        { error: "Cannot delete address used in orders" },
        { status: 400 }
      );
    }

    await prisma.address.delete({ where: { id } });

    // If deleted was default, set another as default
    if (address.isDefault) {
      const nextAddress = await prisma.address.findFirst({
        where: { userId: session.user.id },
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
  } catch (error) {
    console.error("Address DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

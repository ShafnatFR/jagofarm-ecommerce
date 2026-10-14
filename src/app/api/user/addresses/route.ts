import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: { isDefault: "desc" },
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("Addresses GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const addressSchema = z.object({
  label: z.string().min(1, "Label alamat wajib diisi").max(50, "Label maksimal 50 karakter"),
  recipientName: z
    .string()
    .min(2, "Nama penerima minimal 2 karakter")
    .max(100, "Nama penerima maksimal 100 karakter"),
  phone: z
    .string()
    .min(10, "Nomor telepon minimal 10 digit")
    .max(20, "Nomor telepon maksimal 20 digit")
    .regex(/^[0-9+\-\s()]+$/, "Format nomor telepon tidak valid"),
  province: z.string().min(1, "Provinsi wajib diisi").max(100),
  provinceId: z.string().max(20).optional().or(z.literal("")),
  city: z.string().min(1, "Kota/kabupaten wajib diisi").max(100),
  cityId: z.string().max(20).optional().or(z.literal("")),
  // Kecamatan wajib — dipakai untuk akurasi ongkir (checkout memakai districtId).
  district: z.string().min(1, "Kecamatan wajib diisi").max(100),
  districtId: z.string().max(20).optional().or(z.literal("")),
  // Kode pos 5 digit — konsisten dengan form (pattern="[0-9]{5}") & lib/validators.
  postalCode: z
    .string()
    .regex(/^[0-9]{5}$/, "Kode pos harus 5 digit angka"),
  detail: z.string().max(500, "Detail alamat maksimal 500 karakter").optional().or(z.literal("")),
  street: z.string().optional(), // alias for detail
  isDefault: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Handle street alias for detail
    const detail = data.detail || data.street || "";
    const district = data.district || "";

    // If setting as default, unset others
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // If this is the first address, make it default
    const count = await prisma.address.count({
      where: { userId: session.user.id },
    });
    if (count === 0) data.isDefault = true;

    const address = await prisma.address.create({
      data: {
        label: data.label,
        recipientName: data.recipientName,
        phone: data.phone,
        province: data.province,
        provinceId: data.provinceId || null,
        city: data.city,
        cityId: data.cityId || null,
        district,
        districtId: data.districtId || null,
        postalCode: data.postalCode,
        detail,
        isDefault: data.isDefault,
        userId: session.user.id,
      },
    });

    return NextResponse.json(
      { message: "Address created", address },
      { status: 201 }
    );
  } catch (error) {
    console.error("Addresses POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(request: NextRequest) {
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
  label: z.string().min(1).max(50),
  recipientName: z.string().min(1).max(100),
  phone: z.string().min(8).max(20),
  province: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  district: z.string().min(1).max(100),
  postalCode: z.string().min(4).max(10),
  detail: z.string().optional(),
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
        ...data,
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

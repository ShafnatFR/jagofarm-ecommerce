import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Verify ownership
    const address = await prisma.address.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    // If setting as default, unset others
    if (body.isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: body,
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

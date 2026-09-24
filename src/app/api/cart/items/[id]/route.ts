import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateCartItemSchema } from "@/lib/validators";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_QUANTITY = 99;

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Cari baris cart item milik user.
 *
 * `id` idealnya UUID baris cart_items (serverItemId). Kalau yang dikirim bukan
 * UUID (mis. id lokal gabungan `${productId}-${variantId}` milik zustand),
 * fallback ke lookup (cartId, productId, variantId) — null-safe untuk produk
 * tanpa varian (variant_id NULL).
 */
async function findOwnedCartItem(
  userId: string,
  id: string,
  productId: string,
  variantId: string | null
) {
  if (UUID_RE.test(id)) {
    const byId = await prisma.cartItem.findFirst({
      where: { id, cart: { userId } },
      include: { product: true, variant: true },
    });
    if (byId) return byId;
  }

  if (productId) {
    return prisma.cartItem.findFirst({
      where: { productId, variantId, cart: { userId } },
      include: { product: true, variant: true },
    });
  }

  return null;
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
    const { searchParams } = new URL(request.url);

    let body: Record<string, unknown>;
    try {
      const parsedBody = await request.json();
      body = (parsedBody ?? {}) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "Body request tidak valid" },
        { status: 400 }
      );
    }

    const parsed = updateCartItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { quantity } = parsed.data;

    const productId =
      readString(body.productId) || (searchParams.get("productId") ?? "");
    const variantId =
      readString(body.variantId) || (searchParams.get("variantId") ?? "") || null;

    const cartItem = await findOwnedCartItem(
      session.user.id,
      id,
      productId,
      variantId
    );

    if (!cartItem) {
      return NextResponse.json(
        { error: "Item keranjang tidak ditemukan" },
        { status: 404 }
      );
    }

    const productName = cartItem.product.name;
    const availableStock = cartItem.variant
      ? cartItem.variant.stock
      : cartItem.product.stock;

    if (quantity > availableStock) {
      return NextResponse.json(
        {
          error: `Stok tidak mencukupi untuk ${productName}. Tersedia ${availableStock}.`,
        },
        { status: 400 }
      );
    }

    await prisma.cartItem.update({
      where: { id: cartItem.id },
      data: { quantity },
    });

    /*
     * Rapikan duplikat lama (sisa bug dedupe item tanpa varian): baris dengan
     * (cartId, productId, variantId) sama digabung supaya checkout tidak
     * menghitung item yang sama dua kali.
     */
    const duplicates = await prisma.cartItem.findMany({
      where: {
        cartId: cartItem.cartId,
        productId: cartItem.productId,
        variantId: cartItem.variantId,
        id: { not: cartItem.id },
      },
    });

    let finalQuantity = quantity;
    if (duplicates.length > 0) {
      const merged = quantity + duplicates.reduce((sum, d) => sum + d.quantity, 0);
      finalQuantity = Math.max(
        1,
        Math.min(merged, availableStock, MAX_QUANTITY)
      );

      await prisma.$transaction([
        prisma.cartItem.deleteMany({
          where: { id: { in: duplicates.map((d) => d.id) } },
        }),
        prisma.cartItem.update({
          where: { id: cartItem.id },
          data: { quantity: finalQuantity },
        }),
      ]);
    }

    return NextResponse.json({
      message: "Jumlah item diperbarui",
      item: {
        id: cartItem.id,
        productId: cartItem.productId,
        variantId: cartItem.variantId,
        quantity: finalQuantity,
      },
    });
  } catch (error) {
    console.error("Cart update error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui item keranjang" },
      { status: 500 }
    );
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
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId") ?? "";
    const variantId = (searchParams.get("variantId") ?? "") || null;

    const cartItem = await findOwnedCartItem(
      session.user.id,
      id,
      productId,
      variantId
    );

    if (!cartItem) {
      return NextResponse.json(
        { error: "Item keranjang tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.cartItem.delete({ where: { id: cartItem.id } });

    return NextResponse.json({
      message: "Item dihapus dari keranjang",
      id: cartItem.id,
    });
  } catch (error) {
    console.error("Cart delete error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus item keranjang" },
      { status: 500 }
    );
  }
}

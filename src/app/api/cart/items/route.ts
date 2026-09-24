import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addToCartSchema } from "@/lib/validators";

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "P2002"
  );
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Body request tidak valid" },
        { status: 400 }
      );
    }

    const parsed = addToCartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { productId, quantity } = parsed.data;
    const variantId = parsed.data.variantId ?? null;

    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true },
    });
    if (!product) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }

    // Validasi varian: harus milik produk yang sama
    let availableStock = product.stock;
    if (variantId) {
      const variant = await prisma.productVariant.findFirst({
        where: { id: variantId, productId },
      });
      if (!variant) {
        return NextResponse.json(
          { error: "Varian produk tidak ditemukan" },
          { status: 404 }
        );
      }
      availableStock = variant.stock;
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id },
      });
    }

    /*
     * FIX dedupe item tanpa varian:
     * Baris cart_items menyimpan variant_id = NULL untuk produk tanpa varian,
     * sedangkan compound unique (cartId, productId, variantId) pada Prisma
     * tidak bisa di-lookup dengan variantId "" (string kosong != NULL), sehingga
     * add-to-cart berulang membuat baris duplikat. Dengan findFirst + variantId
     * null, NULL match NULL dan duplikat tidak lagi terbentuk.
     */
    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId, variantId },
    });

    const requestedQty = (existingItem?.quantity ?? 0) + quantity;

    if (requestedQty > availableStock) {
      return NextResponse.json(
        {
          error: `Stok tidak mencukupi untuk ${product.name}. Tersedia ${availableStock}, diminta ${requestedQty}.`,
        },
        { status: 400 }
      );
    }

    let cartItem;
    if (existingItem) {
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: requestedQty },
      });
    } else {
      try {
        cartItem = await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            variantId,
            quantity,
          },
        });
      } catch (error) {
        // Balapan request paralel: unique constraint -> ulangi sebagai update.
        if (!isUniqueConstraintError(error)) throw error;

        const conflicting = await prisma.cartItem.findFirst({
          where: { cartId: cart.id, productId, variantId },
        });
        if (!conflicting) throw error;

        const retryQty = conflicting.quantity + quantity;
        if (retryQty > availableStock) {
          return NextResponse.json(
            {
              error: `Stok tidak mencukupi untuk ${product.name}. Tersedia ${availableStock}, diminta ${retryQty}.`,
            },
            { status: 400 }
          );
        }

        cartItem = await prisma.cartItem.update({
          where: { id: conflicting.id },
          data: { quantity: retryQty },
        });
      }
    }

    return NextResponse.json(
      {
        message: "Item ditambahkan ke keranjang",
        item: {
          id: cartItem.id,
          productId: cartItem.productId,
          variantId: cartItem.variantId,
          quantity: cartItem.quantity,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add to cart error:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan item ke keranjang" },
      { status: 500 }
    );
  }
}

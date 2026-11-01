import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET  /api/admin/opname — riwayat opname (?productId=, ?limit=).
 * POST /api/admin/opname — catat opname: { productId, physicalStock, note? }.
 *   Sistem baca stok kini, hitung difference, simpan, lalu update stok produk
 *   ke angka fisik + reset penanda alert bila pulih di atas ambang.
 */

const bodySchema = z.object({
  productId: z.string().min(1),
  physicalStock: z.number().int().min(0, "Stok fisik minimal 0"),
  note: z.string().max(1000).optional(),
});

function requireAdmin(session: { user?: { id?: string; role?: string } | null } | null) {
  return Boolean(session?.user?.id && session.user.role === "admin");
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!requireAdmin(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const params = new URL(request.url).searchParams;
    const productId = params.get("productId");
    const items = await prisma.stockOpname.findMany({
      where: productId ? { productId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        systemStock: true,
        physicalStock: true,
        difference: true,
        note: true,
        createdAt: true,
        product: { select: { id: true, name: true, sku: true } },
      },
    });
    return NextResponse.json({ opnames: items });
  } catch (error) {
    console.error("[admin/opname] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!requireAdmin(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }
    const product = await prisma.product.findUnique({
      where: { id: parsed.data.productId },
      select: { id: true, stock: true, name: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    const difference = parsed.data.physicalStock - product.stock;
    const result = await prisma.$transaction(async (tx) => {
      const opname = await tx.stockOpname.create({
        data: {
          productId: product.id,
          systemStock: product.stock,
          physicalStock: parsed.data.physicalStock,
          difference,
          note: parsed.data.note?.trim() || null,
          createdBy: session!.user!.id,
        },
      });
      await tx.product.update({
        where: { id: product.id },
        data: {
          stock: parsed.data.physicalStock,
          // Pulihkan penanda alert bila stok fisik di atas ambang.
          ...(difference > 0 ? { lastStockAlertAt: null } : {}),
        },
      });
      return opname;
    });

    return NextResponse.json({ opname: result }, { status: 201 });
  } catch (error) {
    console.error("[admin/opname] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

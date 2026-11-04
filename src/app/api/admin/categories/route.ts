import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";

    const where: Prisma.CategoryWhereInput = {};
    if (search) {
      // Odoo-like: cocokkan SETIAP kata kunci (AND), case-insensitive
      const terms = search.trim().split(/\s+/).filter(Boolean);
      if (terms.length > 0) {
        where.AND = terms.map((term) => ({
          name: { contains: term, mode: "insensitive" },
        }));
      }
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { products: true } },
      },
      take: 50,
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Admin categories GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, imageUrl, parentId, sortOrder, isActive } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = slugify(name);

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "Category with this name already exists" },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: { name, slug, description, imageUrl, parentId, sortOrder: sortOrder || 0, isActive: isActive ?? true },
    });

    return NextResponse.json({ message: "Category created", category }, { status: 201 });
  } catch (error) {
    console.error("Admin categories POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

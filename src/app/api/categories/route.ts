import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  children: CategoryNode[];
}

export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { products: { where: { isActive: true } } } },
      },
    });

    const rootCategories = categories.filter((c) => !c.parentId);
    const childMap = new Map<string, typeof categories>();

    categories.forEach((cat) => {
      if (cat.parentId) {
        const children = childMap.get(cat.parentId) || [];
        children.push(cat);
        childMap.set(cat.parentId, children);
      }
    });

    function buildTree(parents: typeof categories): CategoryNode[] {
      return parents.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        sortOrder: cat.sortOrder,
        children: buildTree(childMap.get(cat.id) || []),
      }));
    }

    return NextResponse.json({ categories: buildTree(rootCategories) });
  } catch (error) {
    console.error("Categories error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

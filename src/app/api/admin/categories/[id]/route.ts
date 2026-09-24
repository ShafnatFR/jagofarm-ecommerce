import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

/**
 * PATCH  /api/admin/categories/{id}  -> ubah kategori
 * DELETE /api/admin/categories/{id}  -> hapus kategori (ditolak 409 bila masih dipakai)
 */

async function guardAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || (role !== "admin" && role !== "staff")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await guardAdmin();
    if (denied) return denied;

    const { id } = await params;

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Body request tidak valid" }, { status: 400 });
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    const data: {
      name?: string;
      slug?: string;
      description?: string | null;
      parentId?: string | null;
      isActive?: boolean;
      sortOrder?: number;
    } = {};

    if (body.name !== undefined) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) {
        return NextResponse.json({ error: "Nama kategori wajib diisi." }, { status: 400 });
      }
      if (name.length > 100) {
        return NextResponse.json(
          { error: "Nama kategori maksimal 100 karakter." },
          { status: 400 }
        );
      }
      data.name = name;
    }

    if (body.slug !== undefined) {
      const rawSlug = typeof body.slug === "string" ? body.slug.trim() : "";
      const slug = rawSlug ? slugify(rawSlug) : "";
      if (!slug) {
        return NextResponse.json({ error: "Slug tidak boleh kosong." }, { status: 400 });
      }
      data.slug = slug;
    } else if (data.name && data.name !== existing.name) {
      // Nama berubah tanpa slug eksplisit -> slug diturunkan dari nama.
      data.slug = slugify(data.name);
    }

    if (data.slug && data.slug !== existing.slug) {
      const clash = await prisma.category.findUnique({ where: { slug: data.slug } });
      if (clash && clash.id !== id) {
        return NextResponse.json(
          { error: `Kategori dengan slug "${data.slug}" sudah ada.` },
          { status: 409 }
        );
      }
    }

    if (body.description !== undefined) {
      const description =
        body.description === null
          ? null
          : typeof body.description === "string"
            ? body.description.trim()
            : null;
      data.description = description ? description : null;
    }

    if (body.parentId !== undefined) {
      const rawParent = typeof body.parentId === "string" ? body.parentId.trim() : "";
      const parentId = !rawParent || rawParent === "none" ? null : rawParent;

      if (parentId === id) {
        return NextResponse.json(
          { error: "Kategori tidak dapat menjadi induk bagi dirinya sendiri." },
          { status: 400 }
        );
      }

      if (parentId) {
        const parent = await prisma.category.findUnique({ where: { id: parentId } });
        if (!parent) {
          return NextResponse.json({ error: "Kategori induk tidak ditemukan." }, { status: 400 });
        }

        // Cegah siklus: induk tidak boleh merupakan turunan dari kategori ini.
        let cursor: string | null = parent.parentId;
        const visited = new Set<string>([parent.id]);
        while (cursor && !visited.has(cursor)) {
          if (cursor === id) {
            return NextResponse.json(
              { error: "Kategori induk tidak boleh diambil dari sub-kategori sendiri." },
              { status: 400 }
            );
          }
          visited.add(cursor);
          const node: { parentId: string | null } | null = await prisma.category.findUnique({
            where: { id: cursor },
            select: { parentId: true },
          });
          cursor = node?.parentId ?? null;
        }
      }

      data.parentId = parentId;
    }

    if (body.isActive !== undefined) {
      data.isActive = Boolean(body.isActive);
    }

    if (body.sortOrder !== undefined) {
      const sortOrder = Number(body.sortOrder);
      if (!Number.isFinite(sortOrder)) {
        return NextResponse.json(
          { error: "Urutan (sortOrder) harus berupa angka." },
          { status: 400 }
        );
      }
      data.sortOrder = Math.trunc(sortOrder);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Tidak ada perubahan yang dikirim." },
        { status: 400 }
      );
    }

    const category = await prisma.category.update({
      where: { id },
      data,
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { products: true, children: true } },
      },
    });

    return NextResponse.json({ message: "Kategori berhasil diperbarui", category });
  } catch (error) {
    console.error("Admin category PATCH error:", error);
    return NextResponse.json({ error: "Gagal memperbarui kategori" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await guardAdmin();
    if (denied) return denied;

    const { id } = await params;

    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, children: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    const productCount = existing._count.products;
    if (productCount > 0) {
      return NextResponse.json(
        {
          error: `Kategori "${existing.name}" masih dipakai oleh ${productCount} produk. Pindahkan atau hapus produk tersebut terlebih dahulu.`,
        },
        { status: 409 }
      );
    }

    const childCount = existing._count.children;
    if (childCount > 0) {
      return NextResponse.json(
        {
          error: `Kategori "${existing.name}" masih memiliki ${childCount} sub-kategori. Hapus atau pindahkan sub-kategori terlebih dahulu.`,
        },
        { status: 409 }
      );
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ message: `Kategori "${existing.name}" berhasil dihapus.` });
  } catch (error) {
    console.error("Admin category DELETE error:", error);
    return NextResponse.json({ error: "Gagal menghapus kategori" }, { status: 500 });
  }
}

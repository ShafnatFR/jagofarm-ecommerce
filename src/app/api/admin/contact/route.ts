import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/contact
 *
 * Daftar pesan masuk dari contact form (kotak masuk admin).
 *
 * Query:
 *  - status : "all" | "unread" | "read"  (default: "all")
 *  - search : cari di nama / email / telepon / subjek / pesan
 *  - page   : default 1
 *  - limit  : default 20, maksimal 100
 *
 * Response: { messages, pagination, summary }
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    const rawStatus = (searchParams.get("status") || "all").toLowerCase();
    const status =
      rawStatus === "unread" || rawStatus === "read" ? rawStatus : "all";

    const search = (searchParams.get("search") || "").trim();

    const page = Math.max(
      1,
      parseInt(searchParams.get("page") || "1", 10) || 1
    );
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20)
    );

    // Filter dasar (search) — dipakai untuk daftar DAN ringkasan.
    const baseWhere: Prisma.ContactMessageWhereInput = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
              { subject: { contains: search, mode: "insensitive" } },
              { message: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const where: Prisma.ContactMessageWhereInput = {
      ...baseWhere,
      ...(status === "unread" ? { status: "unread" } : {}),
      ...(status === "read" ? { status: "read" } : {}),
    };

    const skip = (page - 1) * limit;

    const [messages, total, unreadCount, readCount] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.contactMessage.count({ where }),
      prisma.contactMessage.count({ where: { ...baseWhere, status: "unread" } }),
      prisma.contactMessage.count({ where: { ...baseWhere, status: "read" } }),
    ]);

    return NextResponse.json({
      messages: messages.map((message) => ({
        id: message.id,
        name: message.name,
        email: message.email,
        phone: message.phone,
        topic: message.topic,
        subject: message.subject,
        message: message.message,
        status: message.status,
        isRead: message.status === "read",
        emailSent: message.emailSent,
        emailError: message.emailError,
        ipAddress: message.ipAddress,
        createdAt: message.createdAt,
        readAt: message.readAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      summary: {
        total: unreadCount + readCount,
        unread: unreadCount,
        read: readCount,
      },
    });
  } catch (error) {
    console.error("Admin contact GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

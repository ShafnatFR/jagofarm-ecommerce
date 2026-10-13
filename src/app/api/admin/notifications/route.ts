import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listNotifications, markAllNotificationsRead } from "@/lib/notifications";

/**
 * GET /api/admin/notifications
 * Daftar notifikasi terbaru + jumlah belum dibaca (bell header admin).
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await listNotifications(20);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[notifications] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/notifications
 * Body: { action: "read-all" } — tandai semua sudah dibaca.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as { action?: string };
    if (body.action === "read-all") {
      const count = await markAllNotificationsRead();
      return NextResponse.json({ ok: true, updated: count });
    }

    return NextResponse.json({ error: "Aksi tidak dikenal." }, { status: 400 });
  } catch (error) {
    console.error("[notifications] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

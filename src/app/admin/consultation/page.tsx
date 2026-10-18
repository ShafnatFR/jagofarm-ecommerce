import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  listConsultationSessions,
  getConsultationThread,
  type ConsultationSessionSummary,
} from "@/lib/consultation-admin";
import { ConsultationThreadPanel } from "./consultation-thread";
import { AutoRefresh } from "@/components/admin/auto-refresh";
import { APP_TIME_ZONE } from "@/lib/utils";

export const metadata = { title: "Konsultasi - Admin JagoFarm" };

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIME_ZONE,
  }).format(new Date(value));
}

function SessionListItem({
  session,
  active,
}: {
  session: ConsultationSessionSummary;
  active: boolean;
}) {
  return (
    <Link
      href={`/admin/consultation?session=${session.id}`}
      className={`block border-b border-outline-variant/60 px-4 py-3 transition-colors ${
        active ? "bg-primary/10" : "hover:bg-surface-container-low"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-on-surface">
            {session.userName || session.guestName || session.userEmail || session.guestEmail || "Tanpa nama"}
          </p>
          <p className="truncate text-xs text-on-surface-variant">
            {session.source === "guest" ? "Tamu · " : ""}
            {session.sessionRef || session.id.slice(0, 8)} · {formatDate(session.updatedAt)}
          </p>
        </div>
        {session.unreadCount > 0 ? (
          <span className="shrink-0 rounded-full bg-error px-2 py-0.5 text-[10px] font-bold text-on-error">
            {session.unreadCount}
          </span>
        ) : null}
      </div>
      {(session.guestEmail || session.userEmail) && (
        <p className="mt-0.5 truncate text-[11px] text-on-surface-variant">
          {session.userEmail || session.guestEmail}
        </p>
      )}
      <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant">
        {session.lastMessage || "Belum ada pesan"}
      </p>
    </Link>
  );
}

export default async function AdminConsultationPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session: selectedId } = await searchParams;
  const sessions = await listConsultationSessions();
  const thread = selectedId ? await getConsultationThread(selectedId) : null;
  // Catatan: penandaan "sudah dibaca" sengaja TIDAK dilakukan di sini.
  // Server action yang memanggil revalidatePath() tidak boleh jalan saat render
  // (Next.js melempar error), jadi itu dipicu dari client setelah halaman tampil.

  const unreadTotal = sessions.reduce((total, session) => total + session.unreadCount, 0);

  return (
    <div className="space-y-4">
      <AutoRefresh intervalMs={20000} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Konsultasi</h1>
          <p className="text-sm text-on-surface-variant">
            {sessions.length} sesi · {unreadTotal} pesan belum dibalas
          </p>
        </div>
        <Link href="/admin/consultation">
          <Button variant="secondary" size="sm">
            <Icon name="refresh" size={16} className="mr-2" />
            Muat ulang
          </Button>
        </Link>
      </div>

      {sessions.length === 0 ? (
        <Card className="p-12 text-center">
          <Icon name="forum" size={40} className="mx-auto text-on-surface-variant" />
          <p className="mt-2 text-sm text-on-surface-variant">
            Belum ada sesi konsultasi. Sesi baru muncul saat pelanggan mengirim pesan dari
            halaman /consultation.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <Card className="overflow-hidden">
            <div className="max-h-[70vh] overflow-y-auto">
              {sessions.map((session) => (
                <SessionListItem
                  key={session.id}
                  session={session}
                  active={session.id === selectedId}
                />
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            {thread ? (
              <ConsultationThreadPanel
                sessionId={thread.session.id}
                status={thread.session.status}
                messages={thread.messages}
                contactName={thread.session.userName || thread.session.guestName}
                contactEmail={thread.session.userEmail || thread.session.guestEmail}
                contactPhone={thread.session.guestPhone}
                isGuest={thread.session.source === "guest"}
              />
            ) : (
              <div className="flex min-h-[420px] items-center justify-center p-12 text-center">
                <div>
                  <Icon name="forum" size={40} className="mx-auto text-on-surface-variant" />
                  <p className="mt-2 text-sm text-on-surface-variant">
                    Pilih salah satu sesi di sebelah kiri untuk membaca dan membalas.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
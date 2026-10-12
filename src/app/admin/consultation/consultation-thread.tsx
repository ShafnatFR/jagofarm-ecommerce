"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  markConsultationRead,
  replyToConsultation,
  setConsultationStatus,
  type ConsultationMessageRow,
} from "@/lib/consultation-admin";

function formatTime(value: Date | string): string {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ConsultationThreadPanel({
  sessionId,
  expertName,
  status,
  messages,
}: {
  sessionId: string;
  expertName: string;
  status: string;
  messages: ConsultationMessageRow[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const closed = status === "closed";

  // Tandai pesan sebagai dibaca dari client: server action yang memanggil
  // revalidatePath() dilarang jalan saat render server component.
  useEffect(() => {
    startTransition(async () => {
      try {
        await markConsultationRead(sessionId);
        router.refresh();
      } catch {
        // Badge unread yang tidak akurat bukan kondisi fatal.
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const send = () => {
    const content = draft.trim();
    if (!content) return;
    setError(null);
    setDraft("");
    startTransition(async () => {
      try {
        await replyToConsultation(sessionId, content);
        router.refresh();
      } catch (err) {
        setDraft(content); // kembalikan isi kalau gagal terkirim
        setError(err instanceof Error ? err.message : "Gagal mengirim balasan.");
      }
    });
  };

  const changeStatus = (next: string) => {
    startTransition(async () => {
      try {
        await setConsultationStatus(sessionId, next);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal mengubah status.");
      }
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-outline-variant px-4 py-3">
        <div>
          <p className="text-sm font-bold text-on-surface">{expertName}</p>
          <p className="text-xs text-on-surface-variant">
            Balas sebagai ahli — pesan muncul langsung di halaman pelanggan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-1 text-[11px] font-bold ${
              closed
                ? "bg-error-container text-on-error-container"
                : "bg-primary-fixed text-on-primary-fixed"
            }`}
          >
            {status}
          </span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={isPending}
            onClick={() => changeStatus(closed ? "active" : "closed")}
          >
            <Icon name={closed ? "undo" : "check"} size={16} className="mr-2" />
            {closed ? "Buka lagi" : "Tandai selesai"}
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-surface-container-low px-4 py-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-on-surface-variant">Belum ada pesan.</p>
        ) : (
          messages.map((message) => {
            const fromExpert = message.senderType === "expert";
            return (
              <div key={message.id} className={`flex ${fromExpert ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    fromExpert
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-lowest text-on-surface border border-outline-variant"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  <p className={`mt-1 text-[10px] ${fromExpert ? "text-on-primary/70" : "text-on-surface-variant"}`}>
                    {message.senderType} · {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-outline-variant bg-surface-container-lowest px-4 py-3">
        {error ? <p className="mb-2 text-xs text-error">{error}</p> : null}
        <div className="flex items-end gap-2">
          <textarea
            className="min-h-[64px] w-full resize-y rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none disabled:bg-surface-container"
            placeholder={closed ? "Sesi ditutup — buka lagi untuk membalas." : "Tulis balasan untuk pelanggan…"}
            value={draft}
            disabled={isPending || closed}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                send();
              }
            }}
          />
          <Button type="button" onClick={send} disabled={isPending || closed || !draft.trim()}>
            <Icon name="send" size={16} className="mr-2" />
            {isPending ? "Mengirim..." : "Kirim"}
          </Button>
        </div>
        <p className="mt-1.5 text-[11px] text-on-surface-variant">Ctrl+Enter untuk mengirim cepat.</p>
      </div>
    </div>
  );
}
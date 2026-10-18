"use client";

import { useState, useEffect, useCallback, FormEvent, useRef } from "react";
import Link from "next/link";
import { create } from "zustand";
import { TEAM } from "@/lib/constants";
import { TicketForm, type CreatedTicket } from "./ticket-form";
import {
  readLocalTickets,
  saveLocalTicket,
  getTicketToken,
  type LocalTicket,
} from "@/lib/consultation-store";

interface Message {
  id: string;
  senderType: "user" | "expert" | "system";
  content: string;
  attachments: string[];
  createdAt: string;
}

interface TicketView {
  sessionId: string;
  sessionRef: string | null;
  status: string;
  expertName: string;
  messages: Message[];
}

/** Ringkasan tiket yang tampil di sidebar. */
interface TicketSummary {
  id: string;
  sessionRef: string | null;
  status: string;
  expertName: string;
  updatedAt: string;
  lastMessage: string | null;
  lastSenderType: string | null;
}

/**
 * Tiket yang sedang dibuka.
 *
 * Sidebar dan area chat dirender bersamaan, jadi pilihan disimpan di luar React
 * (zustand, pola sama dengan cart-store). `null` berarti belum ada tiket
 * terpilih — area chat menampilkan form pembuatan tiket.
 */
const useTicketSelection = create<{
  selectedId: string | null;
  select: (id: string | null) => void;
}>((set) => ({
  selectedId: null,
  select: (selectedId) => set({ selectedId }),
}));

const formatRelative = (iso: string) => {
  const date = new Date(iso);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
};

/** Header otorisasi tiket: token tamu hanya dikirim bila tersimpan di browser. */
function ticketHeaders(sessionId: string): HeadersInit {
  const token = getTicketToken(sessionId);
  return token
    ? { "x-consultation-token": token, Accept: "application/json" }
    : { Accept: "application/json" };
}

export default function ConsultationChat() {
  const [ticket, setTicket] = useState<TicketView | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  /** Tiket yang isinya sudah dimuat (mencegah fetch ganda). */
  const loadedIdRef = useRef<string | null>(null);

  const selectedId = useTicketSelection((s) => s.selectedId);
  const select = useTicketSelection((s) => s.select);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  /** Muat isi tiket. `silent` dipakai polling agar tidak memicu spinner. */
  const loadTicket = useCallback(async (sessionId: string, silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await fetch(`/api/consultation/ticket/${sessionId}`, {
        headers: ticketHeaders(sessionId),
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          typeof data?.error === "string" ? data.error : "Gagal memuat tiket"
        );
      }

      // Respons basi (user sudah pindah tiket) dibuang.
      if (useTicketSelection.getState().selectedId !== sessionId) return;

      const incoming: Message[] = Array.isArray(data.messages) ? data.messages : [];
      setTicket({
        sessionId: data.sessionId,
        sessionRef: data.sessionRef ?? null,
        status: data.status ?? "active",
        expertName: data.expertName || TEAM.LABEL,
        messages: incoming,
      });
      setMessages(incoming);
    } catch (err) {
      if (silent) return;
      setError(err instanceof Error ? err.message : "Gagal memuat tiket");
      loadedIdRef.current = null;
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Muat tiket saat pilihan berubah; pilihan null = tampilkan form.
  // Reset state ditunda satu tick: setState sinkron di badan effect memicu
  // cascading render (aturan react-hooks/set-state-in-effect).
  useEffect(() => {
    if (!selectedId) {
      loadedIdRef.current = null;
      const timer = setTimeout(() => {
        setTicket(null);
        setMessages([]);
      }, 0);
      return () => clearTimeout(timer);
    }
    if (loadedIdRef.current === selectedId) return;
    loadedIdRef.current = selectedId;
    void loadTicket(selectedId);
  }, [selectedId, loadTicket]);

  // Polling 5 detik supaya balasan tim muncul tanpa reload.
  useEffect(() => {
    if (!selectedId) return;
    const interval = setInterval(() => {
      void loadTicket(selectedId, true);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedId, loadTicket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /** Simpan tiket baru ke browser lalu buka tiketnya. */
  const handleCreated = (created: CreatedTicket) => {
    saveLocalTicket({
      sessionId: created.sessionId,
      sessionRef: created.sessionRef,
      accessToken: created.accessToken,
      createdAt: new Date().toISOString(),
    });
    loadedIdRef.current = null;
    select(created.sessionId);
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!ticket || !input.trim() || sending) return;

    const text = input.trim();
    setInput("");
    setSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/consultation/ticket/${ticket.sessionId}`, {
        method: "POST",
        headers: {
          ...ticketHeaders(ticket.sessionId),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          typeof data?.error === "string" ? data.error : "Gagal mengirim pesan"
        );
      }

      setMessages((prev) => [...prev, data]);

      // Perbarui cuplikan pesan terakhir di daftar lokal (tanpa fetch ulang).
      const local = readLocalTickets().find((item) => item.sessionId === ticket.sessionId);
      if (local) {
        saveLocalTicket({ ...local, lastMessage: text, lastSenderType: "user" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim pesan");
      setInput(text); // kembalikan isi supaya tidak hilang
    } finally {
      setSending(false);
    }
  };

  // Belum ada tiket terpilih -> tampilkan form pembuatan tiket.
  if (!selectedId) {
    return <TicketForm onCreated={handleCreated} />;
  }

  if (loading && !ticket) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-outline-variant border-t-primary" />
          <span className="text-sm text-on-surface-variant">Memuat tiket…</span>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-on-surface-variant">
          {error || "Tiket tidak dapat dimuat."}
        </p>
        <button
          type="button"
          onClick={() => select(null)}
          className="text-xs font-bold text-primary hover:underline"
        >
          Buat tiket baru
        </button>
      </div>
    );
  }

  const isClosed = ticket.status === "closed";

  return (
    <div className="flex h-full flex-col">
      {/* Header tiket */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-low/60 px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative shrink-0">
            <div className="h-12 w-12 overflow-hidden rounded-xl border border-outline-variant bg-surface-container shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element -- avatar lokal (SVG), bukan aset remote */}
              <img alt={TEAM.LABEL} className="h-full w-full object-cover" src={TEAM.AVATAR} />
            </div>
            {!isClosed && (
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-surface bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-serif text-base font-bold text-on-surface sm:text-lg">
              {ticket.expertName}
            </h3>
            <p className="flex flex-wrap items-center gap-1.5 truncate text-xs text-on-surface-variant">
              {isClosed ? (
                <span>Tiket ditutup</span>
              ) : (
                <>
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-primary dark:text-tertiary">Aktif</span>
                </>
              )}
              {ticket.sessionRef && <span className="truncate opacity-75">• {ticket.sessionRef}</span>}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => select(null)}
          className="shrink-0 rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold text-on-surface transition hover:bg-surface-container"
        >
          Tiket baru
        </button>
      </div>

      {/* Daftar pesan */}
      <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-error/30 bg-error-container/20 p-3 text-xs text-error">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{error}</span>
          </div>
        )}

        {messages
          .filter((message) => message.senderType === "system")
          .map((message) => (
            <div key={message.id} className="my-1 flex items-center justify-center">
              <span className="rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-[11px] text-on-surface-variant">
                {message.content}
              </span>
            </div>
          ))}

        {messages
          .filter((message) => message.senderType !== "system")
          .map((message) => {
            const isUser = message.senderType === "user";
            return (
              <div
                key={message.id}
                className={`flex max-w-[90%] gap-2.5 ${isUser ? "ml-auto justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="mt-1 h-8 w-8 shrink-0 overflow-hidden rounded-full border border-outline-variant bg-surface-container shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element -- avatar lokal (SVG) */}
                    <img alt={TEAM.LABEL} className="h-full w-full object-cover" src={TEAM.AVATAR} />
                  </div>
                )}

                <div className={`space-y-1 ${isUser ? "text-right" : "text-left"}`}>
                  <div className={`text-[10px] ${isUser ? "pr-1 text-right" : "pl-1"}`}>
                    {isUser ? (
                      <span className="text-on-surface-variant">Anda</span>
                    ) : (
                      <span className="font-semibold text-primary dark:text-tertiary">
                        {ticket.expertName}
                      </span>
                    )}
                    <span className="ml-1 text-on-surface-variant/70">
                      {new Date(message.createdAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div
                    className={`${
                      isUser
                        ? "inline-block max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-left text-sm leading-relaxed text-on-primary shadow-sm"
                        : "w-full rounded-2xl rounded-tl-sm border border-outline-variant bg-surface-container-low p-3.5 text-sm leading-relaxed text-on-surface shadow-xs"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  </div>

                  {message.attachments.length > 0 && (
                    <div className={`flex gap-1 ${isUser ? "justify-end" : ""}`}>
                      {message.attachments.map((attachment, index) => (
                        <span
                          key={index}
                          className="rounded border border-outline-variant bg-surface-container px-2 py-0.5 text-[10px] font-medium text-primary"
                        >
                          {attachment}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div
                    aria-hidden
                    className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-primary/15 text-xs font-bold text-primary"
                  >
                    A
                  </div>
                )}
              </div>
            );
          })}

        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-on-surface-variant">
            Belum ada pesan pada tiket ini.
          </p>
        )}
      </div>

      {/* Input balasan */}
      <div className="shrink-0 border-t border-outline-variant bg-surface-container-low/60 px-4 py-3">
        {isClosed ? (
          <p className="py-2 text-center text-xs text-on-surface-variant">
            Tiket ini sudah ditutup. Buka tiket baru untuk melanjutkan konsultasi.
          </p>
        ) : (
          <>
            <form onSubmit={sendMessage} className="flex items-center gap-2">
              <input
                aria-label="Tulis pesan konsultasi"
                className="w-full flex-1 rounded-xl border border-outline-variant bg-surface py-2.5 pl-3.5 pr-10 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Tulis pesan untuk tim kami…"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                aria-label="Kirim pesan"
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary shadow-sm transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-base" data-icon="send">
                  send
                </span>
              </button>
            </form>
            <p className="mt-1.5 text-center text-[10px] text-on-surface-variant/80">
              Tekan Enter untuk mengirim • Balasan tim muncul otomatis di halaman ini
            </p>
          </>
        )}
      </div>

      <div ref={messagesEndRef} />
    </div>
  );
}

export function ConsultationSidebar() {
  const [localTickets, setLocalTickets] = useState<LocalTicket[]>([]);
  const [accountTickets, setAccountTickets] = useState<TicketSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "history">("active");

  const selectedId = useTicketSelection((s) => s.selectedId);
  const select = useTicketSelection((s) => s.select);

  // Segarkan daftar setiap kali tiket yang dibuka berubah: tiket baru langsung
  // muncul di sidebar tanpa menunggu interval 15 detik.
  useEffect(() => {
    if (!selectedId) return;
    const timer = setTimeout(() => setLocalTickets(readLocalTickets()), 0);
    return () => clearTimeout(timer);
  }, [selectedId]);

  // Baca tiket lokal lebih dulu (sinkron, tanpa jaringan) supaya tiket tamu
  // langsung tampil walau /api/consultation lambat atau menggantung.
  useEffect(() => {
    const timer = setTimeout(() => setLocalTickets(readLocalTickets()), 0);
    return () => clearTimeout(timer);
  }, []);

  /** Muat tiket lokal (tamu) + tiket akun (bila sedang login). */
  const load = useCallback(async () => {
    setError(null);
    setLocalTickets(readLocalTickets());

    try {
      const res = await fetch("/api/consultation", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      // 401 = pengunjung tanpa akun. Itu normal untuk tamu, bukan error.
      if (res.status === 401) {
        setAccountTickets([]);
        return;
      }
      if (!res.ok) throw new Error("Gagal memuat daftar tiket");

      const data = await res.json().catch(() => ({}));
      const sessions = Array.isArray(data?.sessions) ? data.sessions : [];
      setAccountTickets(
        sessions.map(
          (session: {
            id: string;
            sessionRef: string | null;
            status: string;
            expertName: string;
            updatedAt: string;
            lastMessage: { content: string; senderType: string } | null;
          }): TicketSummary => ({
            id: session.id,
            sessionRef: session.sessionRef,
            status: session.status,
            expertName: session.expertName || TEAM.LABEL,
            updatedAt: session.updatedAt,
            lastMessage: session.lastMessage?.content ?? null,
            lastSenderType: session.lastMessage?.senderType ?? null,
          })
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat daftar tiket");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Ditunda satu tick: load() memanggil setState (loading, daftar tiket) dan
    // setState sinkron di badan effect memicu cascading render.
    const timer = setTimeout(() => void load(), 0);
    const interval = setInterval(() => void load(), 15000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [load]);

  // Gabungkan tiket lokal + akun, yang terbaru di atas. Tiket akun yang sudah
  // ada di daftar lokal tidak diduplikasi.
  const all: TicketSummary[] = [
    ...localTickets.map((local) => ({
      id: local.sessionId,
      sessionRef: local.sessionRef,
      status: "active",
      expertName: TEAM.LABEL,
      updatedAt: local.createdAt,
      lastMessage: local.lastMessage ?? null,
      lastSenderType: local.lastSenderType ?? null,
    })),
    ...accountTickets.filter(
      (account) => !localTickets.some((local) => local.sessionId === account.id)
    ),
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const active = all.filter((item) => item.status !== "closed");
  const history = all.filter((item) => item.status === "closed");
  const visible = tab === "active" ? active : history;

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-outline-variant bg-surface-container-low/40 p-3.5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 font-serif text-base font-bold text-on-surface">
            <span
              className="material-symbols-outlined text-lg text-primary dark:text-tertiary"
              data-icon="forum"
            >
              forum
            </span>
            Tiket Konsultasi
          </h2>
          <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-on-primary">
            {active.length} Aktif
          </span>
        </div>

        <button
          type="button"
          onClick={() => select(null)}
          className="mb-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 py-2 text-xs font-bold text-primary transition hover:bg-primary/15"
        >
          <span className="material-symbols-outlined text-sm" data-icon="add">
            add
          </span>
          Buat Tiket Baru
        </button>

        <div className="grid grid-cols-2 rounded-xl border border-outline-variant bg-surface-container p-1 text-center text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab("active")}
            className={`rounded-lg px-2 py-1.5 transition-all ${
              tab === "active"
                ? "border border-outline-variant bg-surface font-bold text-on-surface shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Aktif ({active.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("history")}
            className={`rounded-lg px-2 py-1.5 transition-all ${
              tab === "history"
                ? "border border-outline-variant bg-surface font-bold text-on-surface shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Selesai ({history.length})
          </button>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 divide-y divide-outline-variant overflow-y-auto">
        {error ? (
          <div className="p-4 text-center">
            <div className="mb-3 rounded-xl border border-error/30 bg-error-container/20 p-2.5 text-xs text-error">
              {error}
            </div>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Coba lagi
            </button>
          </div>
        ) : loading && localTickets.length === 0 && accountTickets.length === 0 ? (
          [0, 1, 2].map((index) => (
            <div key={index} className="animate-pulse p-3.5">
              <div className="flex gap-3">
                <div className="h-11 w-11 shrink-0 rounded-xl bg-surface-container" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded bg-surface-container" />
                  <div className="h-2.5 w-full rounded bg-surface-container" />
                </div>
              </div>
            </div>
          ))
        ) : visible.length === 0 ? (
          <div className="p-6 text-center text-xs text-on-surface-variant">
            {tab === "active"
              ? "Belum ada tiket aktif. Klik “Buat Tiket Baru” untuk memulai konsultasi."
              : "Belum ada tiket yang selesai."}
          </div>
        ) : (
          visible.map((item) => {
            const isSelected = selectedId === item.id;
            const prefix =
              item.lastSenderType === "user"
                ? "Anda: "
                : item.lastSenderType === "expert"
                  ? `${item.expertName}: `
                  : "";
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                aria-current={isSelected ? "true" : undefined}
                onClick={() => select(item.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    select(item.id);
                  }
                }}
                className={`cursor-pointer p-3.5 transition-colors ${
                  isSelected
                    ? "border-l-2 border-primary bg-surface-container"
                    : "hover:bg-surface-container-low/60"
                }`}
              >
                <div className="flex gap-3">
                  <div className="relative shrink-0">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-outline-variant bg-primary/10 text-sm font-bold text-primary">
                      {getInitials(item.expertName)}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface ${
                        item.status !== "closed"
                          ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                          : "bg-outline-variant"
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center justify-between">
                      <h4 className="truncate text-xs font-bold text-on-surface">
                        {item.sessionRef || item.id.slice(0, 8)}
                      </h4>
                      <span className="ml-2 shrink-0 text-[10px] text-on-surface-variant">
                        {formatRelative(item.updatedAt)}
                      </span>
                    </div>
                    <p className="flex items-center gap-1 truncate text-[11px] font-semibold text-primary dark:text-tertiary">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          item.status !== "closed"
                            ? "bg-emerald-500"
                            : "bg-on-surface-variant/40"
                        }`}
                      />
                      {item.status === "closed" ? "Selesai" : "Aktif"}
                    </p>
                    <p className="mt-1 truncate text-[11px] text-on-surface-variant">
                      {item.lastMessage ? (
                        <>
                          {prefix && (
                            <span className="font-medium text-primary dark:text-tertiary">
                              {prefix}
                            </span>
                          )}
                          {item.lastMessage}
                        </>
                      ) : (
                        <span className="text-on-surface-variant/60">Belum ada pesan</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-outline-variant bg-surface-container-low/60 p-3 text-[11px] text-on-surface-variant">
        <span className="flex items-center gap-1">
          <span
            className="material-symbols-outlined text-sm text-primary dark:text-tertiary"
            data-icon="lock"
          >
            lock
          </span>
          Tiket tersimpan aman
        </span>
        <Link href="/faq" className="font-bold text-primary hover:underline dark:text-tertiary">
          Bantuan
        </Link>
      </div>
    </div>
  );
}

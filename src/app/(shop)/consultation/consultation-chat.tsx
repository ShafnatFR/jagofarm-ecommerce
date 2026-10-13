"use client";

import { useState, useEffect, useCallback, FormEvent, useRef } from "react";
import Link from "next/link";
import { create } from "zustand";
import { TEAM } from "@/lib/constants";

interface Message {
  id: string;
  senderType: "user" | "expert" | "system";
  content: string;
  attachments: string[];
  createdAt: string;
}

interface Session {
  sessionId: string;
  sessionRef: string;
  status: string;
  expertName: string;
}

interface ConsultationSessionSummary {
  id: string;
  sessionRef: string | null;
  status: string;
  expertName: string;
  messageCount: number;
  lastMessage: {
    content: string;
    senderType: string;
    createdAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Id sesi yang sedang dibuka di area chat.
 *
 * ConsultationSidebar dan ConsultationChat dirender bersamaan oleh halaman,
 * jadi pilihan sesi disimpan di luar React (zustand, seperti cart-store):
 * klik baris sidebar langsung terbaca oleh area chat, dan sebaliknya sesi
 * yang sedang tampil tersorot di sidebar. `getState()` dipakai untuk membaca
 * pilihan terbaru di dalam async/interval tanpa membuat closure basi.
 */
const useConsultationSelection = create<{
  selectedSessionId: string | null;
  selectSession: (id: string | null) => void;
}>((set) => ({
  selectedSessionId: null,
  selectSession: (selectedSessionId) => set({ selectedSessionId }),
}));

const formatRelative = (iso: string) => {
  const d = new Date(iso);
  const minutes = Math.floor((Date.now() - d.getTime()) / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
};

export default function ConsultationChat() {
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /** Sesi yang sudah dimuat lewat pilihan sidebar (mencegah fetch ganda). */
  const loadedSessionIdRef = useRef<string | null>(null);

  const selectedSessionId = useConsultationSelection((s) => s.selectedSessionId);
  const selectSession = useConsultationSelection((s) => s.selectSession);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadSession = async () => {
    // Sesi yang terbuka diambil dari pilihan sidebar supaya interval/async yang
    // masih berjalan tidak lagi memuat sesi lama setelah user pindah baris.
    const openSessionId = useConsultationSelection.getState().selectedSessionId;
    if (!openSessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/consultation/${openSessionId}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error((data?.error ?? "Gagal memuat sesi").toString());
      }

      // Respons yang datang setelah user pindah sesi dibuang (basi).
      if (useConsultationSelection.getState().selectedSessionId !== openSessionId) return;

      setSession((prev) =>
        prev
          ? {
              ...prev,
              status: data.status,
              expertName: data.expertName || prev.expertName,
            }
          : null
      );
      setMessages(data.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat sesi");
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/consultation/start", { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error((data?.error ?? "Gagal memulai sesi").toString());
      }

      setSession({
        sessionId: data.sessionId,
        sessionRef: data.sessionRef,
        status: data.status,
        expertName: TEAM.LABEL,
      });
      setMessages(data.messages || []);
      // Sesuikan pilihan sidebar dengan sesi yang baru dibuka (sesi aktif
      // terbaru saat halaman dibuka tanpa pilihan dari sidebar).
      loadedSessionIdRef.current = data.sessionId;
      selectSession(data.sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memulai sesi");
    } finally {
      setLoading(false);
    }
  };

  // Klik baris sidebar: muat sesi itu (aktif maupun riwayat) ke area chat.
  useEffect(() => {
    if (!selectedSessionId || loadedSessionIdRef.current === selectedSessionId) return;
    loadedSessionIdRef.current = selectedSessionId;

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const res = await fetch(`/api/consultation/${selectedSessionId}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error((data?.error ?? "Gagal memuat sesi").toString());
        }

        // Respons bisa tiba setelah user memilih sesi lain -> buang yang basi.
        if (
          cancelled ||
          useConsultationSelection.getState().selectedSessionId !== selectedSessionId
        ) {
          return;
        }

        setSession({
          sessionId: data.sessionId,
          sessionRef: data.sessionRef,
          status: data.status,
          expertName: data.expertName || TEAM.LABEL,
        });
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Gagal memuat sesi");
        // Sesi gagal dimuat; klik berikutnya pada baris yang sama boleh mencoba lagi.
        loadedSessionIdRef.current = null;
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedSessionId]);

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!session || !input.trim() || sending) return;

    const text = input.trim();
    setInput("");
    setSending(true);

    try {
      const res = await fetch(`/api/consultation/${session.sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error((data?.error ?? "Gagal mengirim pesan").toString());
      }

      setMessages((prev) => [...prev, data]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim pesan");
      setMessages((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          senderType: "user",
          content: text,
          attachments: [],
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (session) return;
    // Sidebar sudah memilih sesi (mis. user kembali ke halaman) — sesi itulah
    // yang dimuat lewat effect di atas, jangan buka/buat sesi aktif baru.
    if (useConsultationSelection.getState().selectedSessionId) return;
    // Ditunda satu tick: startSession() memanggil setState di baris pertamanya,
    // dan setState sinkron di dalam effect memicu cascading render.
    const timer = setTimeout(() => void startSession(), 0);
    return () => clearTimeout(timer);
    // Sengaja hanya saat mount: guard `session`/selectedSessionId di atas sudah
    // mencegah pembuatan sesi ganda; menambah startSession ke deps akan
    // menjalankan ulang tiap render (startSession bukan useCallback).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling 5 detik mengikuti sesi yang sedang terbuka (aktif atau riwayat):
  // endpoint GET menerima keduanya, jadi tidak perlu percabangan khusus dan
  // balasan pakar tetap terlihat saat user sedang melihat sesi lama.
  useEffect(() => {
    if (session) {
      const interval = setInterval(() => {
        void loadSession();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [session]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAvatar = () => {
    return TEAM.AVATAR;
  };

  if (loading && !session) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-green-200 border-t-green-800 rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Memulai sesi konsultasi...</span>
        </div>
      </div>
    );
  }

  const isActive = session?.status === "active";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-surface-container bg-green-50/50 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-green-700 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element -- avatar lokal (SVG/data-URL), bukan aset remote */}
              <img
                alt={TEAM.LABEL}
                className="w-full h-full object-cover"
                src={getAvatar()}
              />
            </div>
            {isActive && (
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-headline-sm text-sm sm:text-base font-bold text-green-900 truncate">
              {session?.expertName || TEAM.LABEL}
            </h3>
            <p className="text-xs text-gray-500 truncate flex items-center gap-1.5 flex-wrap">
              {isActive ? (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-green-700 font-semibold">Aktif Sekarang</span>
                </>
              ) : (
                <span className="text-gray-500">Sesi tidak aktif</span>
              )}
              {session?.sessionRef && (
                <span className="truncate">• {session.sessionRef}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar bg-white/40 flex-1">
        {error && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</div>
        )}

        <div className="flex items-center justify-center my-1">
          <span className="px-3 py-1 rounded-full bg-green-50 text-[11px] font-semibold text-gray-500">
            {session?.sessionRef
              ? `Hari ini, ${new Date().toLocaleDateString("id-ID")} • Sesi Konsultasi ${session.sessionRef}`
              : "Memulai sesi..."}
          </span>
        </div>

        {/* System message */}
        {messages
          .filter((m) => m.senderType === "system")
          .map((msg) => (
            <div key={msg.id} className="flex items-center justify-center my-1">
              <span className="px-3 py-1 rounded-full bg-green-50 text-[11px] text-gray-500">
                {msg.content}
              </span>
            </div>
          ))}

        {/* Chat messages */}
        {messages
          .filter((m) => m.senderType !== "system")
          .map((msg) => {
            const isUser = msg.senderType === "user";
            return (
              <div
                key={msg.id}
                className={`flex ${
                  isUser ? "justify-end" : "justify-start"
                } gap-2.5 max-w-[90%] ${isUser ? "ml-auto" : ""}`}
              >
                {/* Avatar */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-green-700 shadow-xs mt-1">
                    {/* eslint-disable-next-line @next/next/no-img-element -- avatar lokal (SVG/data-URL), bukan aset remote */}
                    <img
                      alt={TEAM.LABEL}
                      className="w-full h-full object-cover"
                      src={getAvatar()}
                    />
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={`space-y-1 ${
                    isUser
                      ? "text-right"
                      : "text-left"
                  }`}
                >
                  {/* Header */}
                  <div
                    className={`text-[10px] ${
                      isUser ? "text-right pr-1" : "pl-1"
                    }`}
                  >
                    {isUser ? (
                      <span className="text-gray-500">Anda</span>
                    ) : (
                      <span className="text-green-800 font-semibold">
                        {TEAM.LABEL}
                      </span>
                    )}
                    <span className="text-gray-400 ml-1">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>

                  {/* Content */}
                  <div
                    className={`${
                      isUser
                        ? "bg-green-800 text-white rounded-2xl rounded-tr-sm shadow-sm inline-block px-4 py-2.5 max-w-[85%] text-sm text-left leading-relaxed"
                        : "bg-white border border-green-200 rounded-2xl rounded-tl-sm shadow-xs text-sm text-green-900 leading-relaxed p-3.5 w-full"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Attachments indicator */}
                  {msg.attachments.length > 0 && (
                    <div
                      className={`flex gap-1 ${isUser ? "justify-end" : ""}`}
                    >
                      {msg.attachments.map((att, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded bg-green-100 text-green-800 font-medium"
                        >
                          {att}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Avatar user (right side) */}
                {isUser && (
                  <div
                    className="w-8 h-8 rounded-full bg-green-50 text-green-800 flex items-center justify-center font-bold text-xs border border-green-200 shrink-0 mt-1"
                    aria-hidden
                  >
                    A
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Chat input */}
      <div className="px-4 py-3 bg-white border-t border-surface-container flex-shrink-0">
        <form
          onSubmit={sendMessage}
          className="flex items-center gap-2"
        >
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              className="w-full pl-3.5 pr-10 py-2.5 bg-white rounded-xl text-body-md text-green-900 border border-green-200 focus:border-green-700 focus:ring-1 focus:ring-primary-container focus:outline-none placeholder:text-gray-500 text-sm"
              placeholder="Ketik pertanyaan atau laporkan kondisi kolam Anda ke Tim Kami..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || sending || !session}
            className="px-4 py-2.5 rounded-xl bg-green-800 text-white font-bold text-sm flex items-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95 transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-base" data-icon="send">
              send
            </span>
          </button>
        </form>
        <p className="text-[10px] text-gray-500 text-center mt-1.5">
          Tekan Enter untuk mengirim pesan • Konsultasi dilindungi kerahasiaan SOP formulasi JagoFarm
        </p>
      </div>

      {/* Auto-scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}

export function ConsultationSidebar() {
  const [sessions, setSessions] = useState<ConsultationSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "history">("active");

  const selectedSessionId = useConsultationSelection((s) => s.selectedSessionId);
  const selectSession = useConsultationSelection((s) => s.selectSession);

  const loadSessions = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/consultation");
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          (data?.error ?? "Gagal memuat daftar konsultasi").toString()
        );
      }

      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat daftar konsultasi"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Ditunda satu tick: loadSessions() memanggil setState di baris pertamanya,
    // dan setState sinkron di dalam effect memicu cascading render.
    const timer = setTimeout(() => {
      void loadSessions();
    }, 0);
    const interval = setInterval(() => {
      void loadSessions();
    }, 15000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [loadSessions]);

  const activeSessions = sessions.filter((s) => s.status === "active");
  const historySessions = sessions.filter((s) => s.status !== "active");
  const visible = tab === "active" ? activeSessions : historySessions;

  return (
    <div className="flex flex-col h-full">
      <div className="p-3.5 border-b border-surface-container flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-headline-sm text-sm text-green-800 font-bold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-green-800 text-lg" data-icon="forum">
              forum
            </span>
            Konsultasi Pakar
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-800 text-green-100 font-bold">
            {activeSessions.length} Aktif
          </span>
        </div>

        <div className="grid grid-cols-2 p-1 bg-green-50 rounded-xl text-xs font-semibold text-center">
          <button
            type="button"
            onClick={() => setTab("active")}
            className={`py-1.5 px-2 rounded-lg transition-colors ${
              tab === "active"
                ? "bg-white text-green-800 shadow-sm"
                : "text-gray-500 hover:text-green-900"
            }`}
          >
            Sesi Aktif
          </button>
          <button
            type="button"
            onClick={() => setTab("history")}
            className={`py-1.5 px-2 rounded-lg transition-colors ${
              tab === "history"
                ? "bg-white text-green-800 shadow-sm"
                : "text-gray-500 hover:text-green-900"
            }`}
          >
            Riwayat ({historySessions.length})
          </button>
        </div>
      </div>

      {/* Daftar sesi konsultasi */}
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-surface-container">
        {error ? (
          <div className="p-4 text-center">
            <p className="text-xs text-red-600 mb-2">{error}</p>
            <button
              type="button"
              onClick={() => void loadSessions()}
              className="text-xs font-bold text-green-800 hover:underline"
            >
              Coba lagi
            </button>
          </div>
        ) : loading ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="p-3.5 animate-pulse">
              <div className="flex gap-3">
                <div className="w-11 h-11 rounded-xl bg-green-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-green-100 rounded w-2/3" />
                  <div className="h-2.5 bg-green-100/70 rounded w-full" />
                </div>
              </div>
            </div>
          ))
        ) : visible.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-500">
            {tab === "active"
              ? "Belum ada sesi aktif. Mulai dari kotak chat di samping."
              : "Belum ada riwayat konsultasi."}
          </div>
        ) : (
          visible.map((s) => {
            const isActive = s.status === "active";
            const last = s.lastMessage;
            const isSelected = selectedSessionId === s.id;
            const prefix =
              last?.senderType === "user"
                ? "Anda: "
                : last?.senderType === "expert"
                  ? `${s.expertName}: `
                  : "";
            return (
              <div
                key={s.id}
                role="button"
                tabIndex={0}
                aria-current={isSelected ? "true" : undefined}
                onClick={() => selectSession(s.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectSession(s.id);
                  }
                }}
                className={`p-3.5 cursor-pointer transition-colors ${
                  isSelected ? "bg-green-50 ring-1 ring-inset ring-green-300" : "hover:bg-green-50"
                }`}
              >
                <div className="flex gap-3">
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center text-green-800 font-bold text-sm">
                      {getInitials(s.expertName)}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${
                        isActive ? "bg-green-500" : "bg-outline-variant"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-xs font-bold text-green-900 truncate">
                        {s.expertName}
                      </h4>
                      <span className="text-[10px] text-gray-500 shrink-0 ml-2">
                        {formatRelative(s.updatedAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-green-800 font-semibold truncate flex items-center gap-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive ? "bg-emerald-600" : "bg-gray-400"
                        }`}
                      />
                      {isActive ? "Aktif" : "Nonaktif"}
                      {s.sessionRef ? ` • ${s.sessionRef}` : ""}
                    </p>
                    <p className="text-[11px] text-gray-700 truncate mt-1">
                      {last ? (
                        <>
                          {prefix && (
                            <span className="font-medium text-green-800">
                              {prefix}
                            </span>
                          )}
                          {last.content}
                        </>
                      ) : (
                        <span className="text-gray-400">Belum ada pesan</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 bg-green-50 border-t border-green-200 text-[11px] flex items-center justify-between flex-shrink-0">
        <span className="text-gray-500 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm text-green-800" data-icon="lock">
            lock
          </span>
          Sesi Anda tersimpan aman
        </span>
        <Link href="/faq" className="text-green-800 font-bold hover:underline">
          Bantuan
        </Link>
      </div>
    </div>
  );
}

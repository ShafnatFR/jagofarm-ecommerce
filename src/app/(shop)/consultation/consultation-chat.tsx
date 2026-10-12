"use client";

import { useState, useEffect, FormEvent, useRef } from "react";

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

export default function ConsultationChat() {
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadSession = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/consultation/${session.sessionId}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error((data?.error ?? "Gagal memuat sesi").toString());
      }

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
        expertName: "Dr. Ir. Hendra Wardana, M.Si",
      });
      setMessages(data.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memulai sesi");
    } finally {
      setLoading(false);
    }
  };

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
    // Ditunda satu tick: startSession() memanggil setState di baris pertamanya,
    // dan setState sinkron di dalam effect memicu cascading render.
    const timer = setTimeout(() => void startSession(), 0);
    return () => clearTimeout(timer);
  }, []);

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
    return "https://lh3.googleusercontent.com/aida-public/AB6AXuBEvQPAm45DcLIBPjuyYR4fx0A9JGRuZXIk8MM8tSMDlGYNMrg7p9_WIRyuLuJfJWavGrNhh7GrwNKzAgh446u7OruoVK3nYHLsIoCNS2GLhCObhRxIknqpSN30y4PtVFWvMpUQYJPp79tWssG19c_YXK40aP6fUsOnb5XbXan77w9QVde1SNmtx2eCJjQAYwdrtyT1pqOOF9IfyHrNkpjP7Z0lCeIOZbZf253k0jULgUxPSWu7ntqyyw";
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-surface-container bg-green-50/50 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-green-700 shadow-sm">
              <img
                alt="Dr. Ir. Hendra Wardana, M.Si"
                className="w-full h-full object-cover"
                src={getAvatar()}
              />
            </div>
            <span
              className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-headline-sm text-sm sm:text-base font-bold text-green-900 truncate">
                {session?.expertName || "Dr. Ir. Hendra Wardana, M.Si"}
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 inline-flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[11px]" data-icon="verified">
                  verified
                </span>
                Lab IPB
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
              <span className="text-green-700 font-semibold">Aktif Sekarang</span>
              <span>• Sesi Video Siap</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1.5 rounded-xl bg-green-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95 transition-all"
            title="Beralih ke Video Call Google Meet"
          >
            <span className="material-symbols-outlined text-base" data-icon="video_camera_front">
              video_camera_front
            </span>
            <span className="hidden sm:inline">Mulai Video</span>
          </button>
          <button
            className="p-2 rounded-xl border border-green-200 text-green-800 hover:bg-green-50 transition-colors"
            title="Unduh Resep SOP Diagnosa Sementara"
          >
            <span className="material-symbols-outlined text-lg" data-icon="download">
              download
            </span>
          </button>
          <button
            className="p-2 rounded-xl border border-green-200 text-gray-500 hover:text-green-900 hover:bg-green-50 transition-colors lg:hidden"
            title="Data Tambak"
          >
            <span className="material-symbols-outlined text-lg" data-icon="info">
              info
            </span>
          </button>
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
                    <img
                      alt="Dr. Hendra"
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
                        Dr. Ir. Hendra Wardana, M.Si
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
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-green-700 shadow-xs mt-1">
                    <img
                      alt="Anda"
                      className="w-full h-full object-cover"
                      src="https://via.placeholder.com/32"
                    />
                  </div>
                )}
              </div>
            );
          })}

        {/* Typing indicator (statis untuk demo - di real app pakai realtime) */}
        <div className="flex items-center gap-2 text-xs text-gray-500 pl-11">
          <div className="flex items-center gap-1 bg-green-50 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-800 animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-green-800 animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-green-800 animate-bounce [animation-delay:0.4s]" />
            <span className="text-[11px] text-green-800 font-medium ml-1">
              Dr. Hendra sedang mengetik...
            </span>
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="px-4 py-2 bg-white border-t border-green-200/60 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar flex-shrink-0">
        <span className="text-gray-500 text-[11px] font-semibold shrink-0">
          Shortcut:
        </span>
        <button className="px-2.5 py-1 rounded-full bg-white border border-green-200 hover:border-primary text-green-900 whitespace-nowrap font-medium flex items-center gap-1 transition-colors shrink-0">
          <span className="material-symbols-outlined text-sm text-green-800" data-icon="speed">
            speed
          </span>
          Update DO/pH Terkini
        </button>
        <button className="px-2.5 py-1 rounded-full bg-white border border-green-200 hover:border-primary text-green-900 whitespace-nowrap font-medium flex items-center gap-1 transition-colors shrink-0">
          <span className="material-symbols-outlined text-sm text-emerald-600" data-icon="add_photo_alternate">
            add_photo_alternate
          </span>
          Kirim Foto Kolam
        </button>
        <button className="px-2.5 py-1 rounded-full bg-white border border-green-200 hover:border-primary text-green-900 whitespace-nowrap font-medium flex items-center gap-1 transition-colors shrink-0">
          <span className="material-symbols-outlined text-sm text-amber-600" data-icon="picture_as_pdf">
            picture_as_pdf
          </span>
          Minta Resep SOP PDF
        </button>
      </div>

      {/* Chat input */}
      <div className="px-4 py-3 bg-white border-t border-surface-container flex-shrink-0">
        <form
          onSubmit={sendMessage}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            className="p-2.5 rounded-xl border border-green-200 hover:bg-green-50 text-gray-500 hover:text-green-800 transition-colors shrink-0"
            title="Lampirkan Dokumen atau Foto"
          >
            <span className="material-symbols-outlined text-xl" data-icon="attach_file">
              attach_file
            </span>
          </button>
          <button
            type="button"
            className="p-2.5 rounded-xl border border-green-200 hover:bg-green-50 text-gray-500 hover:text-green-800 transition-colors shrink-0 hidden sm:block"
            title="Input Parameter Air Tambak"
          >
            <span className="material-symbols-outlined text-xl" data-icon="tune">
              tune
            </span>
          </button>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              className="w-full pl-3.5 pr-10 py-2.5 bg-white rounded-xl text-body-md text-green-900 border border-green-200 focus:border-green-700 focus:ring-1 focus:ring-primary-container focus:outline-none placeholder:text-gray-500 text-sm"
              placeholder="Ketik pertanyaan atau laporkan kondisi udang ke Dr. Hendra..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
            />
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-green-900"
              title="Sisipkan Emoji"
            >
              <span className="material-symbols-outlined text-lg" data-icon="sentiment_satisfied">
                sentiment_satisfied
              </span>
            </button>
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

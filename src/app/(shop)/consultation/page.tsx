"use client";

import { useState } from "react";
import Link from "next/link";

interface Message {
  id: string;
  sender: "user" | "expert";
  text: string;
  time: string;
  type: "text" | "image" | "file";
}

const mockMessages: Message[] = [
  { id: "1", sender: "expert", text: "Selamat pagi, Pak Budi! Saya sudah lihat foto kolam yang Anda kirim kemarin. Ada beberapa hal yang perlu diperhatikan.", time: "11:02", type: "text" },
  { id: "2", sender: "expert", text: "Pertama, warna air sudah agak kehijauan — ini indikasi pertumbuhan fitoplankton berlebih. Segera naikkan aerasi kincir minimal 8 jam/hari.", time: "11:03", type: "text" },
  { id: "3", sender: "user", text: "Baik Dok, saya cek pH-nya tadi pagi 7.2 dan DO 5.8 mg/L. Apakah masih aman?", time: "11:05", type: "text" },
  { id: "4", sender: "expert", text: "pH 7.2 masih dalam batas aman (ideal 7.0-8.0). Tapi DO 5.8 mg/L agak rendah untuk vaname — minimal 6.0 mg/L. Tambahkan aerasi dan kurangi pakan 10% selama 3 hari.", time: "11:08", type: "text" },
  { id: "5", sender: "expert", text: "Saya lampirkan SOP penanganan air keruh untuk referensi Anda. Silakan unduh di tombol atas.", time: "11:10", type: "file" },
  { id: "6", sender: "user", text: "Terima kasih Dok. Saya juga mau tanya soal pakan — apakah perlu ganti ke protein lebih tinggi?", time: "11:15", type: "text" },
  { id: "7", sender: "expert", text: "Untuk fase pembesaran (umur 30-60 hari), protein 32-35% sudah cukup. Fokus ke kualitas air dulu — kalau air stabil, pertumbuhan akan optimal. Jangan ganti pakan dulu sampai DO stabil di atas 6.0.", time: "11:18", type: "text" },
];

const sessions = [
  { id: "1", name: "Dr. Ir. Hendra Wardana", specialty: "Spesialis Bioflok & Vaname", status: "active", lastMsg: "Segera naikkan aerasi kincir &...", time: "11:18", badge: "Respon Cepat" },
  { id: "2", name: "drh. Farhan Maulana", specialty: "Spesialis Ikan Hias & Koi", status: "history", lastMsg: "SOP Desinfeksi Bak telah diarsipkan", time: "Kemarin" },
  { id: "3", name: "Ir. Siti Aminah", specialty: "Formulasi Nutrisi Hidroponik", status: "history", lastMsg: "Kalkulasi EC 1.8 mS/cm selesai", time: "12 Okt" },
];

export default function ConsultationPage() {
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  return (
    <div className="w-full flex flex-col min-h-screen">
      {/* Breadcrumb + Status */}
      <div className="max-w-7xl mx-auto w-full px-margin py-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-body-sm">
          <nav className="flex items-center text-outline gap-1.5 text-label-sm font-label-sm">
            <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span className="text-primary font-semibold">Live Chat Konsultasi</span>
          </nav>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-fixed/10 border border-outline-variant text-primary text-label-sm font-label-sm">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
              Terhubung Langsung
            </div>
          </div>
        </div>
      </div>

      {/* Chat Layout */}
      <div className="max-w-7xl mx-auto w-full px-margin pb-4 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start" style={{ minHeight: "70vh" }}>
          {/* LEFT SIDEBAR */}
          <aside className="lg:col-span-3 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm flex flex-col overflow-hidden">
            <div className="p-3.5 border-b border-surface-container">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-headline-sm font-headline-sm text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">forum</span>
                  Konsultasi Pakar
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary text-on-primary font-bold">1 Aktif</span>
              </div>
              <div className="grid grid-cols-2 p-1 bg-surface-container-low rounded-xl text-label-sm font-label-sm text-center">
                <button onClick={() => setActiveTab("active")} className={`py-1.5 px-2 rounded-lg transition-colors ${activeTab === "active" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-outline hover:text-on-surface"}`}>Sesi Aktif</button>
                <button onClick={() => setActiveTab("history")} className={`py-1.5 px-2 rounded-lg transition-colors ${activeTab === "history" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-outline hover:text-on-surface"}`}>Riwayat (2)</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-surface-container">
              {sessions.filter((s) => activeTab === "active" ? s.status === "active" : s.status === "history").map((s) => (
                <div key={s.id} className={`p-3.5 cursor-pointer transition-colors ${s.status === "active" ? "bg-primary-fixed/10 border-l-4 border-primary" : "hover:bg-surface-container-low opacity-80 hover:opacity-100"}`}>
                  <div className="flex gap-3">
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center text-primary font-bold text-body-sm">{s.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}</div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${s.status === "active" ? "bg-tertiary" : "bg-outline-variant"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-label-sm font-label-sm font-bold text-on-surface truncate">{s.name}</h4>
                        <span className="text-[10px] text-outline">{s.time}</span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant truncate">{s.specialty}</p>
                      <p className="text-[11px] text-on-surface-variant truncate mt-1">{s.lastMsg}</p>
                    </div>
                  </div>
                  {s.badge && (
                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      <span className="inline-flex items-center gap-1 text-primary bg-primary-fixed/20 px-2 py-0.5 rounded-full font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {s.badge}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="p-3 bg-surface-container-low border-t border-outline-variant text-[11px] flex items-center justify-between">
              <span className="text-outline flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-primary">lock</span>Enkripsi End-to-End</span>
              <a className="text-primary font-bold hover:underline" href="#">Bantuan</a>
            </div>
          </aside>

          {/* MAIN CHAT */}
          <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm flex flex-col overflow-hidden lg:col-span-9" style={{ minHeight: "70vh" }}>
            {/* Chat Header */}
            <div className="px-5 py-3.5 border-b border-surface-container bg-surface-container-low/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center text-primary font-bold text-body-sm border border-outline-variant">HW</div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-tertiary border-2 border-white rounded-full" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-headline-sm font-headline-sm font-bold text-on-surface truncate">Dr. Ir. Hendra Wardana</h3>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary-fixed text-primary inline-flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[11px]">verified</span> Lab IPB
                    </span>
                  </div>
                  <p className="text-label-sm font-label-sm text-on-surface-variant flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-tertiary" />
                    <span className="text-primary font-semibold">Aktif Sekarang</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 rounded-xl bg-primary text-on-primary text-label-sm font-label-sm font-bold flex items-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95 transition-all">
                  <span className="material-symbols-outlined text-[16px]">video_camera_front</span>
                  <span className="hidden sm:inline">Video</span>
                </button>
                <button className="p-2 rounded-xl border border-outline-variant text-primary hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined text-[18px]">download</span>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-surface/40">
              <div className="flex items-center justify-center my-1">
                <span className="px-3 py-1 rounded-full bg-surface-container text-[11px] font-semibold text-outline">Hari ini</span>
              </div>
              {mockMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] sm:max-w-[70%] ${msg.sender === "user" ? "order-2" : ""}`}>
                    {msg.sender === "expert" && (
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-primary text-[10px] font-bold">HW</div>
                        <span className="text-[11px] font-bold text-primary">Dr. Hendra</span>
                      </div>
                    )}
                    <div className={`px-4 py-2.5 rounded-2xl text-body-md font-body-md leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-primary text-on-primary rounded-br-md"
                        : "bg-surface-container-low border border-outline-variant text-on-surface rounded-bl-md"
                    }`}>
                      {msg.text}
                    </div>
                    <p className={`text-[10px] text-outline mt-1 ${msg.sender === "user" ? "text-right" : ""}`}>{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-surface-container bg-surface-container-lowest">
              <div className="flex items-end gap-2">
                <button className="p-2 rounded-xl text-outline hover:text-primary hover:bg-surface-container-low transition-colors shrink-0">
                  <span className="material-symbols-outlined text-[22px]">attach_file</span>
                </button>
                <button className="p-2 rounded-xl text-outline hover:text-primary hover:bg-surface-container-low transition-colors shrink-0">
                  <span className="material-symbols-outlined text-[22px]">photo_camera</span>
                </button>
                <div className="flex-1 relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ketik pesan..."
                    rows={1}
                    className="w-full bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-2xl px-4 py-2.5 text-body-md font-body-md text-on-surface placeholder:text-outline outline-none resize-none transition-colors"
                  />
                </div>
                <button className="p-2.5 rounded-xl bg-primary text-on-primary hover:brightness-110 active:scale-95 transition-all shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[22px]">send</span>
                </button>
              </div>
              <p className="text-[10px] text-outline mt-2 text-center">Konsultasi ini terenkripsi. Kirim foto kolam/ikan untuk diagnosis lebih akurat.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
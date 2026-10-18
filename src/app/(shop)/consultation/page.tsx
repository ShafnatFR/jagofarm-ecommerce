import ConsultationChat, { ConsultationSidebar } from "./consultation-chat";

export const metadata = { title: "Konsultasi Pakar", alternates: { canonical: "/consultation" } };

export default function ConsultationPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header Banner */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-outline-variant text-on-surface text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Konsultasi bersama Tim Pakar JagoFarm</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            Konsultasi Budidaya &amp; Akuaponik
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Buka tiket, ceritakan kebutuhan Anda, dan tim agronomis kami membalas langsung
            di halaman ini. Tidak perlu punya akun.
          </p>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start min-h-[720px]">
        {/* Sidebar — data sesi konsultasi user */}
        <aside className="lg:col-span-4 xl:col-span-3 bg-surface rounded-2xl border border-outline-variant shadow-md flex flex-col h-[720px] overflow-hidden">
          <ConsultationSidebar />
        </aside>

        {/* Area chat — dinamis */}
        <section className="bg-surface rounded-2xl border border-outline-variant shadow-md flex flex-col h-[720px] overflow-hidden lg:col-span-8 xl:col-span-9">
          <ConsultationChat />
        </section>
      </div>
    </div>
  );
}

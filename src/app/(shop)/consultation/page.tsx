import ConsultationChat, { ConsultationSidebar } from "./consultation-chat";

export const metadata = { title: "Konsultasi - JagoFarm" };

export default function ConsultationPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-body-sm">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-emerald-200 text-green-800 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span>Konsultasi bersama Tim Pakar JagoFarm</span>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-grow items-start min-h-[750px]">
        {/* Sidebar — data sesi konsultasi user */}
        <aside className="lg:col-span-3 bg-white rounded-2xl border border-green-200 shadow-sm flex flex-col h-[750px] overflow-hidden">
          <ConsultationSidebar />
        </aside>

        {/* Area chat — dinamis */}
        <section className="bg-white rounded-2xl border border-green-200 shadow-sm flex flex-col h-[750px] overflow-hidden lg:col-span-9">
          <ConsultationChat />
        </section>
      </div>
    </div>
  );
}

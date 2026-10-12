import ConsultationChat from "./consultation-chat";

export const metadata = { title: "Konsultasi - JagoFarm" };

export default function ConsultationPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
      {/* Header statis */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-body-sm">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-emerald-200 text-green-800 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            <span>Terhubung Langsung (Realtime End-to-End)</span>
          </div>
          <span className="text-gray-500 text-xs hidden sm:inline">
            • Sesi ID dinamis (diambil dari API)
          </span>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-grow items-start min-h-[750px]">
        {/* Sidebar — statis, tetap seperti asli */}
        <aside className="lg:col-span-3 bg-white rounded-2xl border border-green-200 shadow-sm flex flex-col h-[750px] overflow-hidden">
          <div className="p-3.5 border-b border-surface-container flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-headline-sm text-sm text-green-800 font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-green-800 text-lg" data-icon="forum">
                  forum
                </span>
                Konsultasi Pakar
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-800 text-green-100 font-bold">
                1 Aktif
              </span>
            </div>

            <div className="grid grid-cols-2 p-1 bg-green-50 rounded-xl text-xs font-semibold text-center">
              <button className="py-1.5 px-2 rounded-lg bg-white text-green-800 shadow-sm">
                Sesi Aktif
              </button>
              <button className="py-1.5 px-2 rounded-lg text-gray-500 hover:text-green-900 transition-colors">
                Riwayat (3)
              </button>
            </div>
          </div>

          {/* Daftar konsultan */}
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-surface-container">
            <div className="p-3.5 bg-green-100/15 border-l-4 border-primary cursor-pointer transition-colors relative">
              <div className="flex gap-3">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-primary/20 shadow-sm">
                    <img
                      alt="Dr. Ir. Hendra Wardana, M.Si"
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEvQPAm45DcLIBPjuyYR4fx0A9JGRuZXIk8MM8tSMDlGYNMrg7p9_WIRyuLuJfJWavGrNhh7GrwNKzAgh446u7OruoVK3nYHLsIoCNS2GLhCObhRxIknqpSN30y4PtVFWvMpUQYJPp79tWssG19c_YXK40aP6fUsOnb5XbXan77w9QVde1SNmtx2eCJjQAYwdrtyT1pqOOF9IfyHrNkpjP7Z0lCeIOZbZf253k0jULgUxPSWu7ntqyyw"
                    />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="text-xs font-bold text-green-900 truncate">
                      Dr. Ir. Hendra Wardana
                    </h4>
                    <span className="text-[10px] text-green-800 font-bold">11:18</span>
                  </div>
                  <p className="text-[11px] text-green-800 font-semibold truncate flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-green-800" data-icon="verified">
                      verified
                    </span>
                    Spesialis Bioflok &amp; Vaname
                  </p>
                  <p className="text-[11px] text-gray-700 truncate mt-1">
                    <span className="font-medium text-green-800">Dr. Hendra:</span>
                    &quot;Segera naikkan aerasi kincir &amp;...&quot;
                  </p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[10px]">
                <span className="inline-flex items-center gap-1 text-green-700 bg-green-100/70 px-2 py-0.5 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Respon Cepat
                </span>
                <span className="text-gray-500">Sisa 32 mnt</span>
              </div>
            </div>

            <div className="p-3.5 hover:bg-green-50 cursor-pointer transition-colors opacity-80 hover:opacity-100">
              <div className="flex gap-3">
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center text-green-800 font-bold text-sm">
                    DF
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-outline-variant border-2 border-white rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="text-xs font-bold text-green-900 truncate">
                      drh. Farhan Maulana
                    </h4>
                    <span className="text-[10px] text-gray-500">Kemarin</span>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">
                    Spesialis Ikan Hias &amp; Koi
                  </p>
                  <p className="text-[11px] text-gray-500 truncate mt-1">
                    SOP Desinfeksi Bak telah diarsipkan
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3.5 hover:bg-green-50 cursor-pointer transition-colors opacity-80 hover:opacity-100">
              <div className="flex gap-3">
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center text-secondary font-bold text-sm">
                    SA
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-outline-variant border-2 border-white rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="text-xs font-bold text-green-900 truncate">
                      Ir. Siti Aminah
                    </h4>
                    <span className="text-[10px] text-gray-500">12 Okt</span>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">
                    Formulasi Nutrisi Hidroponik
                  </p>
                  <p className="text-[11px] text-gray-500 truncate mt-1">
                    Kalkulasi EC 1.8 mS/cm selesai
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-green-50 border-t border-green-200 text-[11px] flex items-center justify-between flex-shrink-0">
            <span className="text-gray-500 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-green-800" data-icon="lock">
                lock
              </span>
              Enkripsi Medis Tambak
            </span>
            <a className="text-green-800 font-bold hover:underline" href="#">
              Bantuan
            </a>
          </div>
        </aside>

        {/* Area chat — dinamis */}
        <section className="bg-white rounded-2xl border border-green-200 shadow-sm flex flex-col h-[750px] overflow-hidden lg:col-span-9">
          <ConsultationChat />
        </section>
      </div>
    </div>
  );
}

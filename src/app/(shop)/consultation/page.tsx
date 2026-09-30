export const metadata = { title: "Konsultasi - JagoFarm" };

export default function Page() {
  return (
    <div dangerouslySetInnerHTML={{__html: `<div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-body-sm">
<nav aria-label="Breadcrumb" className="flex items-center text-outline gap-1.5 text-xs">
<a className="hover:text-primary transition-colors" href="#">Beranda</a>
<span className="material-symbols-outlined text-xs" data-icon="chevron_right">chevron_right</span>
<a className="hover:text-primary transition-colors" href="#">Layanan</a>
<span className="material-symbols-outlined text-xs" data-icon="chevron_right">chevron_right</span>
<span className="text-primary font-semibold">Live Chat Konsultasi Diagnosa</span>
</nav>
<div className="flex items-center gap-2">
<div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
<span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
<span className="">Terhubung Langsung (Realtime End-to-End)</span>
</div>
<span className="text-outline text-xs hidden sm:inline">• Sesi ID: #KF-29402</span>
</div>
</div>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-grow items-start min-h-[750px]">

<aside className="lg:col-span-3 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm flex flex-col h-[750px] overflow-hidden">

<div className="p-3.5 border-b border-surface-container">
<div className="flex items-center justify-between mb-3">
<h2 className="font-headline-sm text-sm text-primary font-bold flex items-center gap-1.5">
<span className="material-symbols-outlined text-primary text-lg" data-icon="forum">forum</span>
<span className="">Konsultasi Pakar</span>
</h2>
<span className="px-2 py-0.5 rounded-full text-[10px] bg-primary text-primary-fixed font-bold">1 Aktif</span>
</div>

<div className="grid grid-cols-2 p-1 bg-surface-container-low rounded-xl text-xs font-semibold text-center">
<button className="py-1.5 px-2 rounded-lg bg-surface-container-lowest text-primary shadow-sm">Sesi Aktif</button>
<button className="py-1.5 px-2 rounded-lg text-outline hover:text-on-surface transition-colors">Riwayat (3)</button>
</div>
</div>

<div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-surface-container">

<div className="p-3.5 bg-primary-fixed/15 border-l-4 border-primary cursor-pointer transition-colors relative">
<div className="flex gap-3">
<div className="relative shrink-0">
<div className="w-12 h-12 rounded-xl overflow-hidden border border-primary/20 shadow-inner">
<img alt="Dr. Ir. Hendra Wardana, M.Si" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEvQPAm45DcLIBPjuyYR4fx0A9JGRuZXIk8MM8tSMDlGYNMrg7p9_WIRyuLuJfJWavGrNhh7GrwNKzAgh446u7OruoVK3nYHLsIoCNS2GLhCObhRxIknqpSN30y4PtVFWvMpUQYJPp79tWssG19c_YXK40aP6fUsOnb5XbXan77w9QVde1SNmtx2eCJjQAYwdrtyT1pqOOF9IfyHrNkpjP7Z0lCeIOZbZf253k0jULgUxPSWu7ntqyyw">
</div>
<span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
</div>
<div className="flex-1 min-w-0">
<div className="flex items-center justify-between mb-0.5">
<h4 className="text-xs font-bold text-on-surface truncate">Dr. Ir. Hendra Wardana</h4>
<span className="text-[10px] text-primary font-bold">11:18</span>
</div>
<p className="text-[11px] text-primary font-semibold truncate flex items-center gap-1">
<span className="material-symbols-outlined text-xs text-primary" data-icon="verified">verified</span>
                Spesialis Bioflok &amp; Vaname
              </p>
<p className="text-[11px] text-on-surface-variant truncate mt-1">
<span className="font-medium text-primary">Dr. Hendra:</span> "Segera naikkan aerasi kincir &amp;..."
              </p>
</div>
</div>
<div className="mt-2.5 flex items-center justify-between text-[10px]">
<span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full font-medium">
<span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Respon Cepat
            </span>
<span className="text-outline">Sisa 32 mnt</span>
</div>
</div>

<div className="p-3.5 hover:bg-surface-container-low cursor-pointer transition-colors opacity-80 hover:opacity-100">
<div className="flex gap-3">
<div className="relative shrink-0">
<div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center text-primary font-bold text-sm">
                DF
              </div>
<span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-outline-variant border-2 border-white rounded-full" />
</div>
<div className="flex-1 min-w-0">
<div className="flex items-center justify-between mb-0.5">
<h4 className="text-xs font-bold text-on-surface truncate">drh. Farhan Maulana</h4>
<span className="text-[10px] text-outline">Kemarin</span>
</div>
<p className="text-[11px] text-outline truncate">Spesialis Ikan Hias &amp; Koi</p>
<p className="text-[11px] text-outline truncate mt-1">SOP Desinfeksi Bak telah diarsipkan</p>
</div>
</div>
</div>
<div className="p-3.5 hover:bg-surface-container-low cursor-pointer transition-colors opacity-80 hover:opacity-100">
<div className="flex gap-3">
<div className="relative shrink-0">
<div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center text-secondary font-bold text-sm">
                SA
              </div>
<span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-outline-variant border-2 border-white rounded-full" />
</div>
<div className="flex-1 min-w-0">
<div className="flex items-center justify-between mb-0.5">
<h4 className="text-xs font-bold text-on-surface truncate">Ir. Siti Aminah</h4>
<span className="text-[10px] text-outline">12 Okt</span>
</div>
<p className="text-[11px] text-outline truncate">Formulasi Nutrisi Hidroponik</p>
<p className="text-[11px] text-outline truncate mt-1">Kalkulasi EC 1.8 mS/cm selesai</p>
</div>
</div>
</div>
</div>

<div className="p-3 bg-surface-container-low border-t border-outline-variant text-[11px] flex items-center justify-between">
<span className="text-outline flex items-center gap-1">
<span className="material-symbols-outlined text-sm text-primary" data-icon="lock">lock</span>
          Enkripsi Medis Tambak
        </span>
<a className="text-primary font-bold hover:underline" href="#">Bantuan</a>
</div>
</aside>

<section className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm flex flex-col h-[750px] overflow-hidden lg:col-span-9">

<div className="px-5 py-3.5 border-b border-surface-container bg-surface-container-low/50 flex items-center justify-between gap-3">
<div className="flex items-center gap-3 min-w-0">
<div className="relative shrink-0">
<div className="w-12 h-12 rounded-xl overflow-hidden border border-primary-container shadow-sm">
<img alt="Dr. Ir. Hendra Wardana, M.Si" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEvQPAm45DcLIBPjuyYR4fx0A9JGRuZXIk8MM8tSMDlGYNMrg7p9_WIRyuLuJfJWavGrNhh7GrwNKzAgh446u7OruoVK3nYHLsIoCNS2GLhCObhRxIknqpSN30y4PtVFWvMpUQYJPp79tWssG19c_YXK40aP6fUsOnb5XbXan77w9QVde1SNmtx2eCJjQAYwdrtyT1pqOOF9IfyHrNkpjP7Z0lCeIOZbZf253k0jULgUxPSWu7ntqyyw">
</div>
<span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
</div>
<div className="min-w-0">
<div className="flex items-center gap-1.5 flex-wrap">
<h3 className="font-headline-sm text-sm sm:text-base font-bold text-on-surface truncate">Dr. Ir. Hendra Wardana, M.Si</h3>
<span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary-fixed text-primary inline-flex items-center gap-0.5">
<span className="material-symbols-outlined text-[11px]" data-icon="verified">verified</span> Lab IPB
              </span>
</div>
<p className="text-xs text-outline truncate flex items-center gap-1.5">
<span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
<span className="text-emerald-700 font-semibold">Aktif Sekarang</span>
<span className="">• Sesi Video Siap</span>
</p>
</div>
</div>

<div className="flex items-center gap-2">

<button className="px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95 transition-all" title="Beralih ke Video Call Google Meet">
<span className="material-symbols-outlined text-base" data-icon="video_camera_front">video_camera_front</span>
<span className="hidden sm:inline">Mulai Video</span>
</button>

<button className="p-2 rounded-xl border border-outline-variant text-primary hover:bg-surface-container transition-colors" title="Unduh Resep SOP Diagnosa Sementara">
<span className="material-symbols-outlined text-lg" data-icon="download">download</span>
</button>

<button className="p-2 rounded-xl border border-outline-variant text-outline hover:text-on-surface hover:bg-surface-container transition-colors lg:hidden" title="Data Tambak">
<span className="material-symbols-outlined text-lg" data-icon="info">info</span>
</button>
</div>
</div>

<div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar bg-surface/40">

<div className="flex items-center justify-center my-1">
<span className="px-3 py-1 rounded-full bg-surface-container text-[11px] font-semibold text-outline">
            Hari ini, 15 Oktober 2026 • Sesi Konsultasi #KF-29402
          </span>
</div>

<div className="p-3 rounded-xl bg-surface-container border border-outline-variant/70 text-xs text-on-surface-variant flex items-start gap-2.5">
<span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5" data-icon="sensors">sensors</span>
<div className="">
<span className="font-bold text-primary">Sistem JagoFarm:</span> Parameter tambak otomatis diteruskan ke Dr. Hendra: <strong>Vaname DOC 45</strong>, DO: <strong>3.4 ppm</strong> (rendah), pH: <strong>7.8</strong>, Suhu: <strong>29.5°C</strong>, Salinitas: <strong>18 ppt</strong>.
          </div>
</div>

<div className="flex items-start gap-3 max-w-[88%]">
<div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-primary-container shadow-xs mt-1">
<img alt="Dr. Hendra" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEvQPAm45DcLIBPjuyYR4fx0A9JGRuZXIk8MM8tSMDlGYNMrg7p9_WIRyuLuJfJWavGrNhh7GrwNKzAgh446u7OruoVK3nYHLsIoCNS2GLhCObhRxIknqpSN30y4PtVFWvMpUQYJPp79tWssG19c_YXK40aP6fUsOnb5XbXan77w9QVde1SNmtx2eCJjQAYwdrtyT1pqOOF9IfyHrNkpjP7Z0lCeIOZbZf253k0jULgUxPSWu7ntqyyw">
</div>
<div className="space-y-1">
<div className="bg-surface-container-lowest border border-outline-variant p-3.5 rounded-2xl rounded-tl-sm shadow-xs text-sm text-on-surface leading-relaxed">
<p className="font-semibold text-primary text-xs mb-1">Dr. Ir. Hendra Wardana, M.Si</p>
              Halo Pak Budi! Selamat pagi. Saya Dr. Hendra dari tim Akuakultur IPB &amp; JagoFarm. Saya melihat data telemetri tambak vaname Anda (Kolam Bulat D3, DOC 45) mengalami drop oksigen terlarut (DO 3.4 ppm) dan pH 7.8.
              <br><br>
              Bagaimana perilaku nafsu makan udang di anco pagi ini, dan apakah ada perubahan warna air yang signifikan setelah hujan lebat kemarin?
            </div>
<span className="text-[10px] text-outline pl-1">11:02 WIB</span>
</div>
</div>

<div className="flex items-start justify-end gap-2.5 max-w-[90%] ml-auto">
<div className="space-y-1 text-right">
<div className="bg-primary text-on-primary p-3.5 rounded-2xl rounded-tr-sm shadow-sm text-sm text-left leading-relaxed">
<p className="">Selamat pagi Dok Hendra. Betul dok, nafsu makan di anco turun hampir 40% pagi ini. Ini dok kondisi air kolam B3 agak keruh kecokelatan sejak hujan kemarin sore, udang agak pasif di pinggir dan insangnya tampak agak kotor.</p>

<div className="mt-2.5 p-2 rounded-xl bg-white/10 border border-white/20">
<div className="relative rounded-lg overflow-hidden h-36 bg-black/30">
<img alt="Foto Sampel Air dan Insang Udang" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKxl0-cNo0emMQRe5RuveWCcmhWsyPdwz9RND2y9TrVzMQrNIzLRICCrPK18w9l703gOpwwmstXZ9xzZ0ZNQLYkInYCfLsSnFnl_B0pbbAq2uNvn61q4lEW3x-4NR8_zxjZxibtMRk0IoRDkFlPWMsw44Yhx2pZiP8u9RtehjikQIo024FifeiKmc2hsqg1_rKz8utPE9dbt1dUlIZb1MPnlMeFyguIxdSLGcDgdb-TqVzpXEqCwRGag">
<span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[11px] px-2 py-0.5 rounded font-mono">sampel_kolam_B3_hujan.jpg</span>
</div>
<div className="flex items-center justify-between text-[11px] text-primary-fixed mt-1.5 px-0.5">
<span className="">Resolusi Tinggi • 2.4 MB</span>
<span className="flex items-center gap-1 font-semibold text-white">
<span className="material-symbols-outlined text-xs" data-icon="check_circle">check_circle</span> Terkirim
                  </span>
</div>
</div>
</div>
<div className="flex items-center justify-end gap-1 text-[10px] text-outline pr-1">
<span className="">11:08 WIB</span>
<span className="material-symbols-outlined text-xs text-primary" data-icon="done_all">done_all</span>
</div>
</div>
</div>

<div className="flex items-start gap-3 max-w-[92%]">
<div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-primary-container shadow-xs mt-1">
<img alt="Dr. Hendra" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEvQPAm45DcLIBPjuyYR4fx0A9JGRuZXIk8MM8tSMDlGYNMrg7p9_WIRyuLuJfJWavGrNhh7GrwNKzAgh446u7OruoVK3nYHLsIoCNS2GLhCObhRxIknqpSN30y4PtVFWvMpUQYJPp79tWssG19c_YXK40aP6fUsOnb5XbXan77w9QVde1SNmtx2eCJjQAYwdrtyT1pqOOF9IfyHrNkpjP7Z0lCeIOZbZf253k0jULgUxPSWu7ntqyyw">
</div>
<div className="space-y-1">
<div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-2xl rounded-tl-sm shadow-xs text-sm text-on-surface leading-relaxed space-y-3">
<div className="flex items-center gap-2 border-b border-surface-container pb-2">
<span className="material-symbols-outlined text-amber-600 text-lg" data-icon="clinical_notes">clinical_notes</span>
<span className="font-bold text-on-surface text-xs uppercase tracking-wider">Diagnosa Lapangan &amp; Tindakan Cepat (Resep #DOC45)</span>
</div>
<p className="">
                Terima kasih fotonya Pak Budi. Terlihat adanya <strong>blooming alga mati (die-off)</strong> pasca air hujan asam mengocok dasar kolam, menyebabkan DO turun ke 3.4 ppm dan detritus menempel di insang udang.
              </p>

<div className="bg-surface-container-low p-3 rounded-xl border border-primary-fixed-dim/60 space-y-1.5 text-xs">
<div className="font-bold text-primary flex items-center gap-1.5">
<span className="material-symbols-outlined text-sm" data-icon="bolt">bolt</span>
                  Protokol 4 Jam Pertama (Wajib Segera):
                </div>
<ol className="list-decimal pl-4 space-y-1 text-on-surface-variant font-medium">
<li className=""><strong>Aerasi Kincir:</strong> Nyalakan 2 kincir tambahan secara nonstop hingga DO stabil &gt; 5.0 ppm.</li>
<li className=""><strong>Puasakan Pakan:</strong> Puasakan 1 feeding session siang ini untuk menekan beban amonia di air.</li>
<li className=""><strong>Kapur Dolomit:</strong> Tebar dolomit 10-15 ppm (sekitar 100 gram/m³) untuk menahan goncangan alkalinitas.</li>
<li className=""><strong>Aplikasi Probiotik:</strong> Inokulasi bakteri Bacillus sp. aktif bersama molase fermentasi.</li>
</ol>
</div>

<div>
<p className="text-xs font-bold text-on-surface mb-2">Produk Rekomendasi Presisi untuk Kasus Ini:</p>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">

<div className="p-2.5 rounded-xl border border-outline-variant bg-white flex items-center gap-2.5 hover:border-primary transition-all">
<div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
<span className="material-symbols-outlined text-2xl" data-icon="water_ph">water_ph</span>
</div>
<div className="flex-1 min-w-0">
<h5 className="text-xs font-bold text-on-surface truncate">Probiotik AquaPure Bioflok 1L</h5>
<span className="text-[11px] font-bold text-primary">Rp 125.000</span>
<div className="flex items-center justify-between mt-1">
<span className="text-[10px] text-outline">Bacillus subtilis</span>
<button className="px-2 py-0.5 rounded-md bg-primary-container text-on-primary text-[10px] font-bold hover:brightness-110">Beli</button>
</div>
</div>
</div>

<div className="p-2.5 rounded-xl border border-outline-variant bg-white flex items-center gap-2.5 hover:border-primary transition-all">
<div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-secondary shrink-0">
<span className="material-symbols-outlined text-2xl" data-icon="inventory_2">inventory_2</span>
</div>
<div className="flex-1 min-w-0">
<h5 className="text-xs font-bold text-on-surface truncate">Dolomit Super Fine Mesh 100</h5>
<span className="text-[11px] font-bold text-primary">Rp 45.000 / sak</span>
<div className="flex items-center justify-between mt-1">
<span className="text-[10px] text-outline">Netralisir Asam</span>
<button className="px-2 py-0.5 rounded-md bg-primary-container text-on-primary text-[10px] font-bold hover:brightness-110">Beli</button>
</div>
</div>
</div>
</div>
</div>
</div>
<span className="text-[10px] text-outline pl-1">11:15 WIB</span>
</div>
</div>

<div className="flex items-start justify-end gap-2.5 max-w-[85%] ml-auto">
<div className="space-y-1 text-right">
<div className="bg-primary text-on-primary p-3 rounded-2xl rounded-tr-sm shadow-sm text-sm text-left leading-relaxed">
<p className="">Baik Dok Hendra, siap! Kincir cadangan sudah kami nyalakan barusan. Untuk dolomit dan probiotik kebetulan masih ada stok di gudang. Apakah perlu cek amonia (TAN) juga sore nanti?</p>
</div>
<div className="flex items-center justify-end gap-1 text-[10px] text-outline pr-1">
<span className="">11:18 WIB</span>
<span className="material-symbols-outlined text-xs text-primary" data-icon="done_all">done_all</span>
</div>
</div>
</div>

<div className="flex items-center gap-2 text-xs text-outline pl-11">
<div className="flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded-full">
<span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
<span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
<span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
<span className="text-[11px] text-primary font-medium ml-1">Dr. Hendra sedang mengetik balasan...</span>
</div>
</div>
</div>

<div className="px-4 py-2 bg-surface border-t border-outline-variant/60 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
<span className="text-outline text-[11px] font-semibold shrink-0">Shortcut:</span>
<button className="px-2.5 py-1 rounded-full bg-surface-container-lowest border border-outline-variant hover:border-primary text-on-surface whitespace-nowrap font-medium flex items-center gap-1 transition-colors">
<span className="material-symbols-outlined text-sm text-primary" data-icon="speed">speed</span> Update DO/pH Terkini
        </button>
<button className="px-2.5 py-1 rounded-full bg-surface-container-lowest border border-outline-variant hover:border-primary text-on-surface whitespace-nowrap font-medium flex items-center gap-1 transition-colors">
<span className="material-symbols-outlined text-sm text-emerald-600" data-icon="add_photo_alternate">add_photo_alternate</span> Kirim Foto Kolam
        </button>
<button className="px-2.5 py-1 rounded-full bg-surface-container-lowest border border-outline-variant hover:border-primary text-on-surface whitespace-nowrap font-medium flex items-center gap-1 transition-colors">
<span className="material-symbols-outlined text-sm text-amber-600" data-icon="picture_as_pdf">picture_as_pdf</span> Minta Resep SOP PDF
        </button>
</div>

<div className="p-3.5 bg-surface-container-lowest border-t border-surface-container">
<div className="flex items-center gap-2">

<button className="p-2.5 rounded-xl border border-outline-variant hover:bg-surface-container text-outline hover:text-primary transition-colors shrink-0" title="Lampirkan Dokumen atau Foto">
<span className="material-symbols-outlined text-xl" data-icon="attach_file">attach_file</span>
</button>

<button className="p-2.5 rounded-xl border border-outline-variant hover:bg-surface-container text-outline hover:text-primary transition-colors shrink-0 hidden sm:block" title="Input Parameter Air Tambak">
<span className="material-symbols-outlined text-xl" data-icon="tune">tune</span>
</button>

<div className="flex-1 relative">
<input className="w-full pl-3.5 pr-10 py-2.5 bg-surface rounded-xl text-body-md text-on-surface border border-outline-variant focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:outline-none placeholder:text-outline text-sm" placeholder="Ketik pertanyaan atau laporkan kondisi udang ke Dr. Hendra..." type="text" value="Iya Dok, apakah malam ini perlu tambah aerasi cadangan jika hujan lagi?">
<button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface" title="Sisipkan Emoji">
<span className="material-symbols-outlined text-lg" data-icon="sentiment_satisfied">sentiment_satisfied</span>
</button>
</div>

<button className="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm flex items-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95 transition-all shrink-0">
<span className="">Kirim</span>
<span className="material-symbols-outlined text-base" data-icon="send">send</span>
</button>
</div>
<p className="text-[10px] text-outline text-center mt-1.5">Tekan Enter untuk mengirim pesan • Konsultasi dilindungi kerahasiaan SOP formulasi JagoFarm</p>
</div>
</section>


</div>`}} />
  );
}

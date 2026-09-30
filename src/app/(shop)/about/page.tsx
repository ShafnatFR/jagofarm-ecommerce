export const metadata = { title: "Tentang Kami - JagoFarm" };

const values = [
  { icon: "gps_fixed", title: "Misi Kami", desc: "Menyediakan peralatan pertanian modern berkualitas tinggi yang terjangkau untuk petani dan penghobi Indonesia, mendukung ketahanan pangan nasional melalui teknologi akuaponik, hidroponik, dan smart farming.", tag: "Ketahanan Pangan Nasional" },
  { icon: "visibility", title: "Visi Kami", desc: "Menjadi platform e-commerce pertanian modern terdepan di Indonesia yang memberdayakan setiap individu untuk bercocok tanam secara mandiri, efisien, dan berkelanjutan.", tag: "Kemandirian & Keberlanjutan" },
  { icon: "eco", title: "Nilai Kami", desc: "Kualitas, inovasi, dan keberlanjutan adalah tiga pilar utama JagoFarm. Kami percaya bahwa pertanian modern adalah kunci masa depan pangan Indonesia yang berdaulat.", tag: "Inovasi Tanpa Batas" },
];

const team = [
  { name: "Ahmad Fauzi", role: "Founder & CEO", desc: "10+ tahun berkecimpung di otomatisasi pertanian & teknologi perikanan darat.", color: "bg-emerald-100 text-emerald-800" },
  { name: "Siti Rahma", role: "Head of Operations", desc: "Spesialis rantai pasok bibit unggul, logistik rantai dingin & pergudangan.", color: "bg-forest-100 text-forest-800" },
  { name: "Budi Santoso", role: "Lead Engineer", desc: "Pengembang sistem sensor smart-monitoring hidroponik dan akuaponik JagoFarm.", color: "bg-teal-100 text-teal-800" },
  { name: "Dewi Lestari", role: "Customer Success", desc: "Memandu ribuan mitra tani mulai dari instalasi awal hingga panen perdana sukses.", color: "bg-green-100 text-green-800" },
];

export default function AboutPage() {
  return (
    <div className="w-full">
      <section className="relative pt-16 pb-20 overflow-hidden bg-gradient-to-b from-white via-forest-50/20 to-[#FAFBFB]">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-emerald-100/40 blur-3xl -z-10 rounded-full pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-forest-50 border border-forest-200/80 text-forest-800 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
            <span className="material-symbols-outlined text-[16px]">eco</span>
            <span>Tentang JagoFarm</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.18] mb-6">Membangun Pertanian &amp; Akuakultur Modern Indonesia</h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">JagoFarm hadir sejak 2020 sebagai solusi <em>one-stop</em> untuk kebutuhan pertanian modern. Dari set tambak, hidroponik, akuaponik, hingga IoT smart farming — kami menyediakan produk berkualitas dengan harga terjangkau untuk semua kalangan.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-12 pt-8 border-t border-gray-200/70 max-w-3xl mx-auto">
            <div className="p-3 text-center"><div className="text-2xl sm:text-3xl font-extrabold text-forest-800">5+ Tahun</div><div className="text-xs sm:text-sm font-medium text-gray-500 mt-1">Dedikasi &amp; Pengalaman</div></div>
            <div className="p-3 text-center"><div className="text-2xl sm:text-3xl font-extrabold text-forest-800">15.000+</div><div className="text-xs sm:text-sm font-medium text-gray-500 mt-1">Petani &amp; Pembudidaya</div></div>
            <div className="p-3 text-center"><div className="text-2xl sm:text-3xl font-extrabold text-forest-800">99.8%</div><div className="text-xs sm:text-sm font-medium text-gray-500 mt-1">Kepuasan Pelanggan</div></div>
            <div className="p-3 text-center"><div className="text-2xl sm:text-3xl font-extrabold text-forest-800">34</div><div className="text-xs sm:text-sm font-medium text-gray-500 mt-1">Provinsi Terjangkau</div></div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-md">Dedikasi Kami</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Cerita Kami</h2>
              <div className="space-y-4 text-gray-600 text-base leading-relaxed">
                <p>Berawal dari sebuah garasi kecil di Surabaya pada tahun 2020, tim kami yang terdiri dari engineer dan pecinta pertanian mulai merakit set hidroponik pertama. Respons yang luar biasa dari komunitas penghobi dan petani skala mikro mendorong kami untuk terus berinovasi tanpa henti.</p>
                <p>Kini, JagoFarm telah melayani ribuan pelanggan di seluruh pelosok Indonesia. Kami merancang produk-produk spesifik yang tahan terhadap kondisi tropis ekstrem Indonesia, mulai dari bibit unggul, anakan ikan bersertifikasi, hingga sensor IoT cerdas yang mempermudah pemantauan kualitas air dan nutrisi secara otomatis via gawai.</p>
              </div>
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-medium text-gray-700">
                {["Dirakit Khusus Iklim Tropis", "Dukungan Edukasi Berkelanjutan", "Kompatibel dengan IoT Mobile", "Garansi Peralatan Resmi"].map((item) => (
                  <div key={item} className="flex items-center gap-2.5"><span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-[14px]">check</span></span>{item}</div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-6">
              <div className="relative bg-gradient-to-tr from-gray-100 to-gray-50 border border-gray-200 rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center min-h-[380px] text-center shadow-soft group hover:border-forest-300 transition-all duration-300">
                <div className="w-24 h-24 rounded-full bg-emerald-50 text-forest-700 flex items-center justify-center mb-5 shadow-inner group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-[48px]">public</span></div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Workshop &amp; Riset Terpadu</h3>
                <p className="text-sm text-gray-500 max-w-sm mb-6">Fasilitas uji coba smart greenhouse dan lab sensor akuakultur JagoFarm di Surabaya, Jawa Timur.</p>
                <div className="inline-flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 text-xs font-semibold text-gray-700"><span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />Kapasitas Uji: 200+ Modul / Bulan</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-[#FAFBFB] border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Nilai-Nilai Kami</h2>
            <p className="text-gray-600 text-base">Fondasi yang mengarahkan setiap inovasi dan layanan yang kami hadirkan untuk ekosistem agrikultur Indonesia.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl p-8 border border-gray-200/90 shadow-sm hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-forest-50 border border-forest-100 text-forest-800 flex items-center justify-center mb-6 group-hover:bg-forest-800 group-hover:text-white transition-colors duration-300"><span className="material-symbols-outlined text-[28px]">{v.icon}</span></div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{v.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{v.desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center text-xs font-semibold text-emerald-700">{v.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Tim Kami</h2>
            <p className="text-gray-600 text-base">Insinyur, agronomis, dan praktisi akuakultur yang berkomitmen memajukan agritech Indonesia.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {team.map((m) => (
              <div key={m.name} className="bg-gray-50/70 border border-gray-200/80 rounded-2xl p-6 text-center hover:shadow-md transition-shadow group">
                <div className={`w-20 h-20 mx-auto rounded-full ${m.color} flex items-center justify-center font-bold text-2xl mb-4 group-hover:scale-105 transition-transform`}><span className="material-symbols-outlined text-[36px]">person</span></div>
                <h3 className="text-lg font-bold text-gray-900">{m.name}</h3>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mt-1 mb-3">{m.role}</p>
                <p className="text-xs text-gray-500 leading-normal">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-forest-800 rounded-3xl p-8 sm:p-14 text-white shadow-xl relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-forest-700/60 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">Hubungi Kami</h2>
              <p className="text-forest-100 text-sm sm:text-base leading-relaxed mb-10">Punya pertanyaan mengenai paket hidroponik, IoT tambak, atau ingin berkolaborasi untuk proyek agritech skala besar? Tim kami siap berdiskusi.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-10">
                {([{ icon: "location_on", label: "Lokasi Workshop", value: "Jl. Pertanian No. 123, Surabaya, Jawa Timur" }, { icon: "call", label: "Telepon & WhatsApp", value: "+62 812-3456-7890" }, { icon: "mail", label: "Email Resmi", value: "hello@jagofarm.id" }]).map((c) => (
                  <div key={c.label} className="bg-forest-900/50 backdrop-blur-sm border border-forest-700/60 rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-forest-700 text-[#98E2C6] flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-[20px]">{c.icon}</span></div>
                    <div><div className="text-xs uppercase text-forest-300 font-semibold tracking-wider">{c.label}</div><div className="text-sm font-semibold text-white mt-1">{c.value}</div></div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <a className="px-6 py-3 bg-white text-forest-800 font-bold text-sm rounded-xl hover:bg-forest-50 transition-colors shadow-md flex items-center gap-2" href="https://wa.me/6281234567890" rel="noopener noreferrer" target="_blank"><span>Hubungi via WhatsApp</span><span className="material-symbols-outlined text-[16px]">arrow_forward</span></a>
                <a className="px-6 py-3 bg-forest-700 hover:bg-forest-600 text-white font-semibold text-sm rounded-xl border border-forest-600 transition-colors" href="mailto:hello@jagofarm.id">Kirim Pesan Surel</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
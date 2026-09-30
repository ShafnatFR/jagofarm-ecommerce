import Link from "next/link";

export const metadata = { title: "Tentang Kami - JagoFarm" };

const values = [
  { icon: "gps_fixed", title: "Misi Kami", desc: "Menyediakan peralatan pertanian modern berkualitas tinggi yang terjangkau untuk petani dan penghobi Indonesia, mendukung ketahanan pangan nasional melalui teknologi akuaponik, hidroponik, dan smart farming.", tag: "Ketahanan Pangan Nasional" },
  { icon: "visibility", title: "Visi Kami", desc: "Menjadi platform e-commerce pertanian modern terdepan di Indonesia yang memberdayakan setiap individu untuk bercocok tanam secara mandiri, efisien, dan berkelanjutan.", tag: "Kemandirian & Keberlanjutan" },
  { icon: "eco", title: "Nilai Kami", desc: "Kualitas, inovasi, dan keberlanjutan adalah tiga pilar utama JagoFarm. Kami percaya bahwa pertanian modern adalah kunci masa depan pangan Indonesia yang berdaulat.", tag: "Inovasi Tanpa Batas" },
];

const team = [
  { name: "Ahmad Fauzi", role: "Founder & CEO", desc: "10+ tahun berkecimpung di otomatisasi pertanian & teknologi perikanan darat.", color: "bg-primary-fixed/20 text-primary" },
  { name: "Siti Rahma", role: "Head of Operations", desc: "Spesialis rantai pasok bibit unggul, logistik rantai dingin & pergudangan.", color: "bg-primary-fixed/20 text-primary" },
  { name: "Budi Santoso", role: "Lead Engineer", desc: "Pengembang sistem sensor smart-monitoring hidroponik dan akuaponik JagoFarm.", color: "bg-tertiary-fixed/20 text-tertiary" },
  { name: "Dewi Lestari", role: "Customer Success", desc: "Memandu ribuan mitra tani mulai dari instalasi awal hingga panen perdana sukses.", color: "bg-tertiary-fixed/20 text-tertiary" },
];

export default function AboutPage() {
  return (
    <div className="w-full">
      {/* HERO */}
      <section className="relative pt-16 pb-20 overflow-hidden bg-gradient-to-b from-white via-surface-container-low to-background">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-primary-fixed/20 blur-3xl -z-10 rounded-full pointer-events-none" />
        <div className="max-w-4xl mx-auto px-margin text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-fixed/10 border border-outline-variant text-primary text-label-md font-label-md mb-6 shadow-sm">
            <span className="material-symbols-outlined text-[16px]">eco</span>
            <span>Tentang JagoFarm</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg md:text-[48px] md:leading-[56px] text-on-surface font-extrabold tracking-tight mb-6">Membangun Pertanian &amp; Akuakultur Modern Indonesia</h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant leading-relaxed max-w-2xl mx-auto">JagoFarm hadir sejak 2020 sebagai solusi <em>one-stop</em> untuk kebutuhan pertanian modern. Dari set tambak, hidroponik, akuaponik, hingga IoT smart farming — kami menyediakan produk berkualitas dengan harga terjangkau untuk semua kalangan.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-8 border-t border-outline-variant/60 max-w-3xl mx-auto">
            {([{ value: "5+ Tahun", label: "Dedikasi & Pengalaman" }, { value: "15.000+", label: "Petani & Pembudidaya" }, { value: "99.8%", label: "Kepuasan Pelanggan" }, { value: "34", label: "Provinsi Terjangkau" }]).map((s) => (
              <div key={s.label} className="p-3 text-center">
                <div className="text-headline-md font-headline-md font-extrabold text-primary">{s.value}</div>
                <div className="text-body-sm font-body-sm text-on-surface-variant mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="py-16 md:py-24 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto px-margin">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 text-label-sm font-label-sm uppercase tracking-wider text-primary bg-primary-fixed/10 px-3 py-1 rounded-md">Dedikasi Kami</div>
              <h2 className="text-headline-lg font-headline-lg text-on-surface">Cerita Kami</h2>
              <div className="space-y-4 text-body-lg font-body-lg text-on-surface-variant leading-relaxed">
                <p>Berawal dari sebuah garasi kecil di Surabaya pada tahun 2020, tim kami yang terdiri dari engineer dan pecinta pertanian mulai merakit set hidroponik pertama. Respons yang luar biasa dari komunitas penghobi dan petani skala mikro mendorong kami untuk terus berinovasi tanpa henti.</p>
                <p>Kini, JagoFarm telah melayani ribuan pelanggan di seluruh pelosok Indonesia. Kami merancang produk-produk spesifik yang tahan terhadap kondisi tropis ekstrem Indonesia, mulai dari bibit unggul, anakan ikan bersertifikasi, hingga sensor IoT cerdas yang mempermudah pemantauan kualitas air dan nutrisi secara otomatis via gawai.</p>
              </div>
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-body-md font-body-md text-on-surface">
                {["Dirakit Khusus Iklim Tropis", "Dukungan Edukasi Berkelanjutan", "Kompatibel dengan IoT Mobile", "Garansi Peralatan Resmi"].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-primary-fixed/20 text-primary flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-[14px]">check</span></span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-6">
              <div className="relative bg-gradient-to-tr from-surface-container-low to-surface-container-lowest border border-outline-variant rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center min-h-[380px] text-center shadow-sm group hover:border-primary/30 transition-all duration-300">
                <div className="w-24 h-24 rounded-full bg-primary-fixed/10 text-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[48px]">public</span>
                </div>
                <h3 className="text-headline-md font-headline-md text-on-surface mb-2">Workshop &amp; Riset Terpadu</h3>
                <p className="text-body-md font-body-md text-on-surface-variant max-w-sm mb-6">Fasilitas uji coba smart greenhouse dan lab sensor akuakultur JagoFarm di Surabaya, Jawa Timur.</p>
                <div className="inline-flex items-center gap-3 bg-surface-container-lowest px-4 py-2 rounded-xl shadow-sm border border-outline-variant text-label-md font-label-md text-on-surface">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-tertiary animate-pulse" />
                  Kapasitas Uji: 200+ Modul / Bulan
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="py-16 md:py-24 bg-background border-t border-outline-variant">
        <div className="max-w-7xl mx-auto px-margin">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-headline-lg font-headline-lg text-on-surface mb-4">Nilai-Nilai Kami</h2>
            <p className="text-body-lg font-body-lg text-on-surface-variant">Fondasi yang mengarahkan setiap inovasi dan layanan yang kami hadirkan untuk ekosistem agrikultur Indonesia.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((v) => (
              <div key={v.title} className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-primary-fixed/10 border border-outline-variant text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-on-primary transition-colors duration-300">
                    <span className="material-symbols-outlined text-[28px]">{v.icon}</span>
                  </div>
                  <h3 className="text-headline-md font-headline-md text-on-surface mb-3">{v.title}</h3>
                  <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">{v.desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-outline-variant flex items-center text-label-md font-label-md text-primary">{v.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="py-16 md:py-24 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto px-margin">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-headline-lg font-headline-lg text-on-surface mb-4">Tim Kami</h2>
            <p className="text-body-lg font-body-lg text-on-surface-variant">Insinyur, agronomis, dan praktisi akuakultur yang berkomitmen memajukan agritech Indonesia.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {team.map((m) => (
              <div key={m.name} className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 text-center hover:shadow-md transition-shadow group">
                <div className={`w-20 h-20 mx-auto rounded-full ${m.color} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                  <span className="material-symbols-outlined text-[36px]">person</span>
                </div>
                <h3 className="text-headline-sm font-headline-sm text-on-surface">{m.name}</h3>
                <p className="text-label-sm font-label-sm text-primary uppercase tracking-wider mt-1 mb-3">{m.role}</p>
                <p className="text-body-sm font-body-sm text-on-surface-variant leading-normal">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT CTA */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-margin">
          <div className="bg-primary rounded-3xl p-8 md:p-14 text-on-primary shadow-xl relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary-container/60 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <h2 className="text-headline-lg font-headline-lg mb-4">Hubungi Kami</h2>
              <p className="text-body-md font-body-md text-primary-fixed leading-relaxed mb-10">Punya pertanyaan mengenai paket hidroponik, IoT tambak, atau ingin berkolaborasi untuk proyek agritech skala besar? Tim kami siap berdiskusi.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-10">
                {([{ icon: "location_on", label: "Lokasi Workshop", value: "Jl. Pertanian No. 123, Surabaya, Jawa Timur" }, { icon: "call", label: "Telepon & WhatsApp", value: "+62 812-3456-7890" }, { icon: "mail", label: "Email Resmi", value: "hello@jagofarm.id" }]).map((c) => (
                  <div key={c.label} className="bg-primary-container/50 backdrop-blur-sm border border-primary-container rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-container text-secondary-fixed-dim flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">{c.icon}</span>
                    </div>
                    <div>
                      <div className="text-label-sm font-label-sm uppercase text-primary-fixed-dim tracking-wider">{c.label}</div>
                      <div className="text-body-md font-body-md font-semibold text-on-primary mt-1">{c.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <a className="px-6 py-3 bg-surface-container-lowest text-primary font-bold text-body-md font-body-md rounded-xl hover:bg-surface-container-low transition-colors shadow-md flex items-center gap-2" href="https://wa.me/6281234567890" rel="noopener noreferrer" target="_blank">
                  <span>Hubungi via WhatsApp</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </a>
                <a className="px-6 py-3 bg-primary-container hover:bg-primary-container/80 text-on-primary font-semibold text-body-md font-body-md rounded-xl border border-primary-container transition-colors" href="mailto:hello@jagofarm.id">
                  Kirim Pesan Surel
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
import Link from "next/link";

export const metadata = { title: "Tentang Kami - JagoFarm" };

export default function AboutPage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-primary text-on-primary py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-margin text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-secondary-fixed-dim text-label-md font-label-md mb-6 backdrop-blur-sm">
            <span className="material-symbols-outlined text-[16px]">eco</span>
            <span>Tentang JagoFarm</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg md:text-[48px] md:leading-[56px] text-on-primary font-extrabold tracking-tight mb-6">
            Membangun Pertanian &amp; Akuakultur Modern Indonesia
          </h1>
          <p className="text-body-lg font-body-lg text-primary-fixed leading-relaxed max-w-2xl mx-auto">
            JagoFarm hadir sejak 2020 sebagai solusi one-stop untuk kebutuhan pertanian modern.
            Dari set tambak, hidroponik, akuaponik, hingga IoT smart farming — kami menyediakan
            produk berkualitas dengan harga terjangkau untuk semua kalangan.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-8 border-t border-white/10 max-w-3xl mx-auto">
            {([
              { value: "5+ Tahun", label: "Dedikasi & Pengalaman" },
              { value: "15.000+", label: "Petani & Pembudidaya" },
              { value: "99.8%", label: "Tingkat Kepuasan" },
              { value: "34 Provinsi", label: "Jangkauan Pengiriman" },
            ]).map((s) => (
              <div key={s.label} className="p-3 text-center">
                <div className="text-headline-md font-headline-md font-extrabold text-secondary-fixed-dim">{s.value}</div>
                <div className="text-body-sm font-body-sm text-primary-fixed-dim mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-7xl mx-auto px-margin py-16">
        <div className="grid gap-8 lg:grid-cols-2 items-center">
          <div>
            <h2 className="text-headline-lg font-headline-lg text-on-surface">Cerita Kami</h2>
            <p className="mt-4 text-body-lg font-body-lg text-on-surface-variant leading-relaxed">
              Berawal dari sebuah garasi kecil di Surabaya, tim kami yang terdiri dari
              engineer dan pecinta pertanian mulai merakit set hidroponik pertama. Respons
              yang luar biasa dari komunitas mendorong kami untuk terus berinovasi.
            </p>
            <p className="mt-3 text-body-lg font-body-lg text-on-surface-variant leading-relaxed">
              Kini, JagoFarm telah melayani ribuan pelanggan di seluruh Indonesia dengan
              produk-produk yang dirancang khusus untuk kondisi tropis Indonesia.
            </p>
          </div>
          <div className="rounded-2xl bg-surface-container-low p-8 flex items-center justify-center min-h-[300px] border border-outline-variant">
            <div className="text-center">
              <span className="material-symbols-outlined text-[80px] text-primary-fixed/40">eco</span>
              <p className="mt-4 text-body-sm font-body-sm text-outline">Foto tim &amp; workshop</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-surface-container-low border-y border-outline-variant/60">
        <div className="max-w-7xl mx-auto px-margin">
          <h2 className="text-headline-lg font-headline-lg text-on-surface text-center">Nilai-Nilai Kami</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {([
              { icon: "gps_fixed", title: "Misi Kami", desc: "Menyediakan peralatan pertanian modern berkualitas tinggi yang terjangkau untuk petani dan penghobi Indonesia." },
              { icon: "visibility", title: "Visi Kami", desc: "Menjadi platform e-commerce pertanian modern terdepan di Indonesia yang memberdayakan setiap individu." },
              { icon: "eco", title: "Nilai Kami", desc: "Kualitas, inovasi, dan keberlanjutan adalah tiga pilar utama JagoFarm." },
            ]).map((v) => (
              <div key={v.title} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 text-center shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-primary-fixed/30 text-primary flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[24px]">{v.icon}</span>
                </div>
                <h3 className="text-headline-sm font-headline-sm text-on-surface mt-4">{v.title}</h3>
                <p className="mt-2 text-body-md font-body-md text-on-surface-variant leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-margin py-16">
        <div className="rounded-3xl bg-primary p-8 text-center text-on-primary sm:p-12">
          <h2 className="text-headline-lg font-headline-lg sm:text-[36px]">Butuh Konsultasi?</h2>
          <p className="mx-auto mt-3 max-w-xl text-body-lg font-body-lg text-primary-fixed/80">
            Tim ahli JagoFarm siap membantu merancang sistem pertanian modern
            yang sesuai dengan kebutuhan dan budget Anda.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/products" className="inline-flex items-center gap-2 bg-secondary-fixed-dim hover:bg-secondary text-primary font-headline-sm text-headline-sm px-7 py-3.5 rounded-full shadow-md transition-all active:scale-95">
              <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
              Mulai Belanja
            </Link>
            <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-on-primary border border-white/30 backdrop-blur-md font-headline-sm text-headline-sm px-6 py-3.5 rounded-full transition-all active:scale-95">
              <span className="material-symbols-outlined text-[20px] text-tertiary-fixed">chat</span>
              Chat via WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
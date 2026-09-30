export const metadata = { title: "Hubungi Kami - JagoFarm" };

export default function ContactPage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-primary text-on-primary py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-margin text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-secondary-fixed-dim text-label-md font-label-md mb-6 backdrop-blur-sm">
            <span className="material-symbols-outlined text-[16px]">support_agent</span>
            <span>Hubungi Kami</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg md:text-[48px] md:leading-[56px] text-on-primary font-extrabold tracking-tight mb-4">
            Kami Siap Membantu Anda
          </h1>
          <p className="text-body-lg font-body-lg text-primary-fixed max-w-2xl mx-auto">
            Punya pertanyaan tentang produk atau butuh konsultasi? Tim kami siap membantu.
          </p>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="max-w-7xl mx-auto px-margin py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {([
            { icon: "location_on", title: "Alamat", lines: ["Jl. Pertanian No. 123", "Surabaya, Jawa Timur 60111", "Indonesia"] },
            { icon: "call", title: "Telepon", lines: ["+62 812-3456-7890", "Senin-Sabtu: 08:00-17:00 WIB"] },
            { icon: "mail", title: "Email", lines: ["hello@jagofarm.id", "support@jagofarm.id"] },
          ]).map((c) => (
            <div key={c.title} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-primary-fixed/30 text-primary flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[28px]">{c.icon}</span>
              </div>
              <h3 className="text-headline-sm font-headline-sm text-on-surface">{c.title}</h3>
              <div className="mt-2 space-y-1">
                {c.lines.map((l, i) => (
                  <p key={i} className="text-body-md font-body-md text-on-surface-variant">{l}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* WhatsApp CTA */}
        <div className="mt-12 rounded-3xl bg-primary p-8 text-center text-on-primary sm:p-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-secondary-fixed-dim text-label-md font-label-md backdrop-blur-sm mb-4">
            <span className="material-symbols-outlined text-[16px]">psychology</span>
            <span>Konsultasi Gratis</span>
          </div>
          <h2 className="text-headline-lg font-headline-lg">Chat Langsung via WhatsApp</h2>
          <p className="mt-2 text-body-lg font-body-lg text-primary-fixed/80">Respon cepat dalam 15 menit pada jam kerja</p>
          <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-6 bg-secondary-fixed-dim hover:bg-secondary text-primary font-headline-sm text-headline-sm px-7 py-3.5 rounded-full shadow-md transition-all active:scale-95">
            <span className="material-symbols-outlined text-[20px]">chat</span>
            Chat Sekarang
          </a>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-label-md font-label-md text-primary-fixed-dim">
            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-secondary-fixed-dim">schedule</span>Respon Cepat &lt; 15 Menit</span>
            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-secondary-fixed-dim">verified</span>Gratis Konsultasi</span>
          </div>
        </div>
      </section>
    </div>
  );
}
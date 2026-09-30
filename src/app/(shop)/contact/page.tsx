export const metadata = { title: "Hubungi Kami - JagoFarm" };

export default function ContactPage() {
  return (
    <div className="w-full">
      {/* HeaderSection */}
      <section className="relative pt-12 pb-8 sm:pt-16 sm:pb-12 text-center overflow-hidden">
        <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[250px] bg-primary-fixed/30 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-margin">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-fixed/10 border border-primary-fixed/40 text-primary text-label-md font-label-md mb-4 shadow-sm">
            <span className="material-symbols-outlined text-[16px] text-primary-container">chat</span>
            <span>Hubungi Kami</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg md:text-[48px] md:leading-[56px] text-on-surface font-extrabold tracking-tight mb-3">
            Kontak
          </h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant max-w-xl mx-auto">
            Ada pertanyaan? Kami senang bisa membantu Anda memulai dan mengembangkan ekosistem agrikultur masa depan.
          </p>
        </div>
      </section>

      {/* MainContentGrid */}
      <section className="max-w-7xl mx-auto px-margin pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ContactInfoColumn */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Contact Detail Cards */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 sm:p-7 shadow-sm divide-y divide-outline-variant/50">
              {/* Address */}
              <div className="pb-5 flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-primary-fixed/10 border border-primary-fixed/20 flex items-center justify-center shrink-0 text-primary shadow-sm mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">location_on</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-label-lg font-label-lg text-on-surface">Alamat</h3>
                    <span className="text-label-sm font-label-sm bg-surface-container-low text-on-surface-variant px-2 py-0.5 rounded-full">Kantor Utama</span>
                  </div>
                  <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">
                    Jl. Pertanian No. 123, Surabaya, Jawa Timur 60111
                  </p>
                  <a className="inline-flex items-center gap-1 text-label-md font-label-md text-primary-container hover:text-primary pt-1" href="#lokasi-peta">
                    Lihat rute navigasi
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="py-5 flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-primary-fixed/10 border border-primary-fixed/20 flex items-center justify-center shrink-0 text-primary shadow-sm mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">call</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-label-lg font-label-lg text-on-surface">Telepon</h3>
                  <p className="text-body-md font-body-md font-medium text-on-surface">
                    <a className="hover:text-primary transition" href="tel:+6281234567890">+62 812-3456-7890</a>
                  </p>
                  <p className="text-body-sm font-body-sm text-outline">Senin - Jumat (08.00 - 17.00 WIB)</p>
                </div>
              </div>

              {/* Email */}
              <div className="py-5 flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-primary-fixed/10 border border-primary-fixed/20 flex items-center justify-center shrink-0 text-primary shadow-sm mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-label-lg font-label-lg text-on-surface">Email</h3>
                  <p className="text-body-md font-body-md font-medium text-on-surface">
                    <a className="hover:text-primary transition" href="mailto:hello@jagofarm.id">hello@jagofarm.id</a>
                  </p>
                  <p className="text-body-sm font-body-sm text-outline">Estimasi balasan: ~2 jam kerja</p>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="pt-5 flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-primary-fixed/10 border border-primary-fixed/20 flex items-center justify-center shrink-0 text-primary shadow-sm mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-label-lg font-label-lg text-on-surface">WhatsApp</h3>
                    <span className="inline-flex items-center gap-1 text-label-sm font-label-sm text-primary bg-primary-fixed/10 px-2 py-0.5 rounded-full border border-primary-fixed/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
                      Respon Cepat
                    </span>
                  </div>
                  <p className="text-body-md font-body-md font-semibold text-on-surface">
                    <a className="hover:text-primary-container transition" href="https://wa.me/6281234567890" rel="noopener noreferrer" target="_blank">
                      +62 812-3456-7890
                    </a>
                  </p>
                  <p className="text-body-sm font-body-sm text-outline">Setiap hari 08.00 - 20.00 WIB</p>
                </div>
              </div>
            </div>

            {/* Map Card */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 shadow-sm overflow-hidden" id="lokasi-peta">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-container" />
                  <h3 className="text-label-md font-label-md uppercase tracking-wider text-on-surface">Peta Lokasi &amp; Gudang</h3>
                </div>
                <span className="text-body-sm font-body-sm text-outline">Surabaya, ID</span>
              </div>
              <div className="relative w-full h-56 rounded-xl bg-surface-container-low border border-outline-variant overflow-hidden group flex items-center justify-center">
                <div className="relative z-10 flex flex-col items-center cursor-pointer transition transform group-hover:-translate-y-1">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg ring-4 ring-surface-container-lowest">
                      <span className="material-symbols-outlined text-[20px]">location_on</span>
                    </div>
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rotate-45" />
                  </div>
                  <div className="mt-2 bg-inverse-surface/90 text-inverse-on-surface text-label-sm font-label-sm py-1 px-2.5 rounded-md shadow-md whitespace-nowrap">
                    JagoFarm Headquarters
                  </div>
                </div>
                <a className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 bg-surface-container-lowest/95 hover:bg-surface-container-lowest text-on-surface text-body-sm font-semibold px-3 py-1.5 rounded-lg shadow-md border border-outline-variant hover:shadow-lg transition duration-150" href="https://maps.google.com" rel="noopener noreferrer" target="_blank">
                  <span>Buka di Google Maps</span>
                  <span className="material-symbols-outlined text-[16px] text-outline">open_in_new</span>
                </a>
              </div>
              <p className="text-body-sm font-body-sm text-outline mt-3 text-center">
                Akses mudah melalui jalur logistik utama Surabaya Barat, parkir armada &amp; truk tersedia.
              </p>
            </div>
          </div>

          {/* ContactFormColumn */}
          <div className="lg:col-span-7">
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 sm:p-10 shadow-sm relative">
              <div className="mb-7">
                <h2 className="text-headline-md font-headline-md text-on-surface tracking-tight">Kirim Pesan</h2>
                <p className="text-body-md font-body-md text-on-surface-variant mt-1">
                  Silakan isi formulir di bawah ini, tim spesialis agrikultur kami akan merespon dalam waktu 1x24 jam.
                </p>
              </div>
              <form className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-label-md font-label-md text-on-surface uppercase tracking-wider mb-2">
                      Nama <span className="text-error">*</span>
                    </label>
                    <input className="w-full rounded-xl border border-outline-variant px-4 py-3 text-body-md font-body-md text-on-surface placeholder-outline focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition outline-none bg-surface-container-low/50 focus:bg-surface-container-lowest" placeholder="Nama Anda" required type="text" />
                  </div>
                  <div>
                    <label className="block text-label-md font-label-md text-on-surface uppercase tracking-wider mb-2">
                      Email <span className="text-error">*</span>
                    </label>
                    <input className="w-full rounded-xl border border-outline-variant px-4 py-3 text-body-md font-body-md text-on-surface placeholder-outline focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition outline-none bg-surface-container-low/50 focus:bg-surface-container-lowest" placeholder="email@anda.com" required type="email" />
                  </div>
                </div>

                {/* Category Chips */}
                <div>
                  <label className="block text-label-md font-label-md text-on-surface uppercase tracking-wider mb-2">Kategori Konsultasi</label>
                  <div className="flex flex-wrap gap-2">
                    {["Pemesanan Produk", "Konsultasi Hidroponik/Tambak", "Smart Farming IoT", "Kemitraan"].map((label, i) => (
                      <label key={label} className="inline-flex items-center text-body-sm font-body-sm cursor-pointer">
                        <input defaultChecked={i === 0} className="peer sr-only" name="topic" type="radio" value={label.toLowerCase().replace(/[^a-z]/g, '')} />
                        <span className="px-3.5 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant peer-checked:bg-primary peer-checked:text-on-primary peer-checked:border-primary transition">
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-label-md font-label-md text-on-surface uppercase tracking-wider mb-2">
                    Subjek <span className="text-error">*</span>
                  </label>
                  <input className="w-full rounded-xl border border-outline-variant px-4 py-3 text-body-md font-body-md text-on-surface placeholder-outline focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition outline-none bg-surface-container-low/50 focus:bg-surface-container-lowest" placeholder="Perihal pesan Anda" required type="text" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-label-md font-label-md text-on-surface uppercase tracking-wider">
                      Pesan <span className="text-error">*</span>
                    </label>
                    <span className="text-body-sm font-body-sm text-outline">Minimal 20 karakter</span>
                  </div>
                  <textarea className="w-full rounded-xl border border-outline-variant px-4 py-3 text-body-md font-body-md text-on-surface placeholder-outline focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition outline-none bg-surface-container-low/50 focus:bg-surface-container-lowest resize-y" placeholder="Tuliskan pesan Anda di sini..." required rows={5} />
                </div>

                <div className="pt-2">
                  <button className="inline-flex items-center justify-center gap-2.5 bg-primary hover:opacity-90 active:opacity-80 text-on-primary font-semibold text-body-md font-body-md px-7 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2" type="submit">
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    <span>Kirim Pesan</span>
                  </button>
                  <span className="text-body-sm font-body-sm text-outline block sm:inline-block sm:ml-4 mt-2 sm:mt-0">
                    Data Anda dijaga kerahasiaannya sesuai kebijakan privasi kami.
                  </span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* QuickFaqSection */}
      <section className="border-t border-outline-variant bg-surface-container-low py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-margin">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-label-md font-label-md text-primary-container uppercase tracking-widest">Bantuan Cepat</span>
            <h2 className="text-headline-md font-headline-md text-on-surface mt-1">Pertanyaan yang Sering Diajukan</h2>
            <p className="text-body-md font-body-md text-outline mt-1">Dapatkan jawaban instan seputar operasional dan pengiriman JagoFarm.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Jangkauan Pengiriman", desc: "Kami melayani pengiriman peralatan tambak, hidroponik, &amp; sensor IoT ke seluruh wilayah Indonesia melalui ekspedisi logistik khusus kargo terpercaya." },
              { title: "Garansi Bibit &amp; Benih", desc: "Semua benih dan anakan ikan tersertifikasi viabilitas tinggi dengan jaminan garansi hidup saat sampai di lokasi Anda dengan protokol klaim 1x24 jam." },
              { title: "Konsultasi Instalasi IoT", desc: "Tersedia layanan survei teknis serta instalasi langsung sistem automasi hidroponik dan tambak cerdas untuk proyek skala komersial maupun rumahan." },
            ].map((faq) => (
              <div key={faq.title} className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
                <h4 className="text-label-lg font-label-lg text-on-surface mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-container" />
                  {faq.title}
                </h4>
                <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed" dangerouslySetInnerHTML={{ __html: faq.desc }} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

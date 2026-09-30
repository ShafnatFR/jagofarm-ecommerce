export const metadata = { title: "Kebijakan Pengiriman - JagoFarm" };

export default function ShippingPolicyPage() {
  return (
    <div className="w-full">
      <section className="bg-forest-800 text-white py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-margin text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-secondary-fixed-dim text-label-md font-label-md mb-6 backdrop-blur-sm">
            <span className="material-symbols-outlined text-[16px]">local_shipping</span>
            <span>Pengiriman</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg md:text-[48px] md:leading-[56px] text-white font-extrabold tracking-tight mb-4">Kebijakan Pengiriman</h1>
          <p className="text-body-lg font-body-lg text-forest-100 max-w-2xl mx-auto">Standardisasi pengiriman bibit hidup beroksigen murni &amp; perlengkapan smart farming ke seluruh Indonesia.</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-margin py-12 space-y-8">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-headline-md font-headline-md text-on-surface mb-4">Area Pengiriman</h2>
          <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed mb-4">Kami mengirim ke seluruh Indonesia dari hub logistik Surabaya dan Jakarta.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {([
              { area: "Jawa", time: "2-4 hari kerja", note: "Reguler & kilat" },
              { area: "Luar Jawa", time: "4-7 hari kerja", note: "Kargo terstandarisasi" },
              { area: "Indonesia Timur", time: "5-10 hari kerja", note: "Via laut/udara" },
              { area: "Benih Hidup", time: "Senin-Kamis saja", note: "Kemasan oksigen khusus" },
            ]).map((item) => (
              <div key={item.area} className="bg-surface-container-low rounded-xl p-4 border border-outline-variant">
                <h3 className="text-headline-sm font-headline-sm text-on-surface">{item.area}</h3>
                <p className="text-body-md font-body-md text-primary font-semibold mt-1">{item.time}</p>
                <p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">{item.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-headline-md font-headline-md text-on-surface mb-4">Kurir &amp; Logistik Rekanan</h2>
          <div className="space-y-3">
            {([
              { name: "SiCepat", desc: "Reguler, BEST, GOKIL (kargo)", badge: "Rekomendasi" },
              { name: "JNE", desc: "Regular, YES, Trucking (JTR)", badge: "" },
              { name: "AnterAja", desc: "Regular, Same Day, Next Day", badge: "" },
              { name: "Dakota Cargo", desc: "Kargo berat untuk paket tambak", badge: "Khusus Berat" },
            ]).map((c) => (
              <div key={c.name} className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-outline-variant">
                <div>
                  <h3 className="text-headline-sm font-headline-sm text-on-surface">{c.name}</h3>
                  <p className="text-body-sm font-body-sm text-on-surface-variant">{c.desc}</p>
                </div>
                {c.badge && <span className="px-2.5 py-0.5 rounded-full text-label-sm font-label-sm bg-forest-100 text-primary">{c.badge}</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-headline-md font-headline-md text-on-surface mb-4">Biaya Pengiriman</h2>
          <ul className="space-y-3 text-body-md font-body-md text-on-surface-variant">
            {[
              "Biaya ongkir dihitung otomatis berdasarkan berat, dimensi, dan lokasi tujuan",
              "Gratis ongkir untuk pembelian di atas Rp500.000 (Jawa) dan Rp1.000.000 (luar Jawa)",
              "Biaya tambahan berlaku untuk pengiriman kargo berat (paket tambak, rangka hidroponik besar)",
              "Asuransi pengiriman opsional tersedia untuk semua jenis produk",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary mt-0.5 shrink-0">check</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-headline-md font-headline-md text-on-surface mb-4">Pengiriman Produk Hidup</h2>
          <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed mb-4">Anakan ikan dan bibit hidup dikirim menggunakan kemasan khusus dengan oksigen murni dan isolasi suhu.</p>
          <div className="bg-forest-50 border border-primary-fixed/20 rounded-xl p-4">
            <h3 className="text-headline-sm font-headline-sm text-primary mb-2">Garansi Live Arrival</h3>
            <p className="text-body-md font-body-md text-on-surface-variant">Jika ikan/bibit mati dalam perjalanan, kami ganti 100% atau refund. Sertakan video unboxing tanpa jeda maksimal 2 jam setelah paket tiba.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
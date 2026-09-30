import Link from "next/link";

export const metadata = { title: "Kebijakan Pengiriman - JagoFarm" };

export default function ShippingpolicyPage() {
  return (
    <div className="w-full">
      <section className="bg-primary text-on-primary py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-margin text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-secondary-fixed-dim text-label-md font-label-md mb-6 backdrop-blur-sm">
            <span className="material-symbols-outlined text-[16px]">local_shipping</span>
            <span>Pengiriman</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg md:text-[48px] md:leading-[56px] text-on-primary font-extrabold tracking-tight mb-4">Kebijakan Pengiriman</h1>
          <p className="text-body-lg font-body-lg text-primary-fixed max-w-2xl mx-auto">Informasi lengkap tentang pengiriman produk JagoFarm ke seluruh Indonesia.</p>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-margin py-12">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-headline-sm font-headline-sm text-on-surface mb-2">Area Pengiriman</h2>
            <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">Kami mengirim ke seluruh Indonesia menggunakan kurir JNE, SiCepat, dan AnterAja.</p>
          </div>
          <div>
            <h2 className="text-headline-sm font-headline-sm text-on-surface mb-2">Estimasi Waktu</h2>
            <ul className="space-y-2 text-body-md font-body-md text-on-surface-variant">
              <li className="flex items-start gap-2"><span className="material-symbols-outlined text-[16px] text-primary mt-0.5">check</span>Jawa: 2-4 hari kerja</li>
              <li className="flex items-start gap-2"><span className="material-symbols-outlined text-[16px] text-primary mt-0.5">check</span>Luar Jawa: 4-7 hari kerja</li>
              <li className="flex items-start gap-2"><span className="material-symbols-outlined text-[16px] text-primary mt-0.5">check</span>Pengiriman ikan hidup: Senin-Kamis saja</li>
            </ul>
          </div>
          <div>
            <h2 className="text-headline-sm font-headline-sm text-on-surface mb-2">Biaya Pengiriman</h2>
            <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">Biaya ongkir dihitung otomatis berdasarkan berat, dimensi, dan lokasi tujuan. Gratis ongkir untuk pembelian di atas Rp500.000 (Jawa) dan Rp1.000.000 (luar Jawa).</p>
          </div>
          <div>
            <h2 className="text-headline-sm font-headline-sm text-on-surface mb-2">Pengiriman Produk Hidup</h2>
            <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">Anakan ikan dikirim menggunakan kemasan khusus dengan oksigen dan isolasi suhu. Garansi 100% sampai tujuan — jika ikan mati dalam perjalanan, kami ganti atau refund 100%.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

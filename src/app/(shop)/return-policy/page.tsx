import Link from "next/link";

export const metadata = { title: "Kebijakan Pengembalian - JagoFarm" };

export default function ReturnpolicyPage() {
  return (
    <div className="w-full">
      <section className="bg-primary text-on-primary py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-margin text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-secondary-fixed-dim text-label-md font-label-md mb-6 backdrop-blur-sm">
            <span className="material-symbols-outlined text-[16px]">assignment_return</span>
            <span>Pengembalian</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg md:text-[48px] md:leading-[56px] text-on-primary font-extrabold tracking-tight mb-4">Kebijakan Pengembalian & Refund</h1>
          <p className="text-body-lg font-body-lg text-primary-fixed max-w-2xl mx-auto">Jaminan kepuasan pelanggan adalah prioritas utama kami.</p>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-margin py-12">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-headline-sm font-headline-sm text-on-surface mb-2">Garansi Produk</h2>
            <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">Semua produk JagoFarm bergaransi resmi. Durasi garansi tergantung jenis produk — silakan cek detail di halaman produk masing-masing.</p>
          </div>
          <div>
            <h2 className="text-headline-sm font-headline-sm text-on-surface mb-2">Syarat Pengembalian</h2>
            <ul className="space-y-2 text-body-md font-body-md text-on-surface-variant">
              <li className="flex items-start gap-2"><span className="material-symbols-outlined text-[16px] text-primary mt-0.5">check</span>Produk rusak/cacat saat diterima</li>
              <li className="flex items-start gap-2"><span className="material-symbols-outlined text-[16px] text-primary mt-0.5">check</span>Produk tidak sesuai deskripsi</li>
              <li className="flex items-start gap-2"><span className="material-symbols-outlined text-[16px] text-primary mt-0.5">check</span>Ikan mati dalam pengiriman (dengan video unboxing)</li>
            </ul>
          </div>
          <div>
            <h2 className="text-headline-sm font-headline-sm text-on-surface mb-2">Proses Refund</h2>
            <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">Hubungi kami via WhatsApp dalam 24 jam setelah barang diterima. Sertakan foto/video sebagai bukti. Refund diproses dalam 3-5 hari kerja.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

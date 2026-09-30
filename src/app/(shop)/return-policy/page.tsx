export const metadata = { title: "Kebijakan Pengembalian - JagoFarm" };

export default function ReturnPolicyPage() {
  return (
    <div className="w-full">
      <section className="bg-primary text-on-primary py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-margin text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-secondary-fixed-dim text-label-md font-label-md mb-6 backdrop-blur-sm">
            <span className="material-symbols-outlined text-[16px]">assignment_return</span>
            <span>Pengembalian</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg md:text-[48px] md:leading-[56px] text-on-primary font-extrabold tracking-tight mb-4">Kebijakan Pengembalian &amp; Refund</h1>
          <p className="text-body-lg font-body-lg text-primary-fixed max-w-2xl mx-auto">Jaminan kepuasan pelanggan adalah prioritas utama kami.</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-margin py-12 space-y-8">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-headline-md font-headline-md text-on-surface mb-4">Syarat Pengembalian</h2>
          <ul className="space-y-3 text-body-md font-body-md text-on-surface-variant">
            {["Produk rusak/cacat saat diterima (foto/video unboxing sebagai bukti)", "Produk tidak sesuai dengan deskripsi di halaman produk", "Kesalahan pengiriman (produk yang dikirim berbeda dari yang dipesan)", "Ikan/bibit mati dalam pengiriman (garansi live arrival)"].map((item) => (
              <li key={item} className="flex items-start gap-2"><span className="material-symbols-outlined text-[16px] text-primary mt-0.5 shrink-0">check</span>{item}</li>
            ))}
          </ul>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-headline-md font-headline-md text-on-surface mb-4">Barang yang Tidak Dapat Dikembalikan</h2>
          <ul className="space-y-3 text-body-md font-body-md text-on-surface-variant">
            {["Produk yang sudah dipasang/digunakan", "Benih/bibit yang sudah ditanam", "Kerusakan akibat kesalahan penggunaan", "Produk yang dikembalikan melebihi batas waktu 24 jam"].map((item) => (
              <li key={item} className="flex items-start gap-2"><span className="material-symbols-outlined text-[16px] text-error mt-0.5 shrink-0">close</span>{item}</li>
            ))}
          </ul>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-headline-md font-headline-md text-on-surface mb-4">Garansi Anakan Ikan Hidup</h2>
          <div className="bg-primary-fixed/10 border border-primary-fixed/20 rounded-xl p-4 mb-4">
            <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">Garansi 100% sampai tujuan. Jika anakan ikan mati dalam pengiriman, kami ganti atau refund 100% tanpa biaya tambahan.</p>
          </div>
          <ul className="space-y-2 text-body-sm font-body-sm text-on-surface-variant">
            {["Sertakan video unboxing tanpa jeda (maksimal 2 jam setelah paket tiba)", "Foto kondisi kemasan dan ikan dari beberapa sudut", "Klaim via WhatsApp ke +62 812-3456-7890"].map((item) => (
              <li key={item} className="flex items-start gap-2"><span className="material-symbols-outlined text-[14px] text-primary mt-0.5 shrink-0">check</span>{item}</li>
            ))}
          </ul>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-headline-md font-headline-md text-on-surface mb-4">Proses Refund</h2>
          <div className="space-y-4">
            {([{ step: "1", title: "Laporkan", desc: "Hubungi kami via WhatsApp dalam 24 jam setelah barang diterima." }, { step: "2", title: "Sertakan Bukti", desc: "Kirim foto/video kondisi produk dan kemasan." }, { step: "3", title: "Verifikasi", desc: "Tim kami akan memverifikasi klaim dalam 1x24 jam." }, { step: "4", title: "Refund", desc: "Refund diproses dalam 3-5 hari kerja ke rekening asal pembayaran." }]).map((s) => (
              <div key={s.step} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold text-headline-sm font-headline-sm shrink-0">{s.step}</div>
                <div><h3 className="text-headline-sm font-headline-sm text-on-surface">{s.title}</h3><p className="text-body-md font-body-md text-on-surface-variant mt-0.5">{s.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
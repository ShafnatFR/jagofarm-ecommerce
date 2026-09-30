export const metadata = { title: "Kebijakan Privasi - JagoFarm" };

export default function Page() {
  return (
    <div dangerouslySetInnerHTML={{__html: `<div className="mb-10 p-5 rounded-2xl bg-brand-50/60 border border-brand-200/70 flex items-start gap-4">
<div className="w-10 h-10 rounded-xl bg-brand-600/10 flex items-center justify-center text-brand-800 flex-shrink-0 mt-0.5">
<i className="w-5 h-5 text-brand-700" data-lucide="info"></i>
</div>
<div className="text-sm leading-relaxed text-slate-700">
<p className="font-semibold text-brand-950 mb-1">Persetujuan Ketentuan Layanan</p>
<p>Dengan membuat akun, berbelanja, atau menggunakan ekosistem layanan JagoFarm, Anda menyetujui praktik yang dijelaskan dalam dokumen ini. Bila Anda tidak menyetujui sebagian atau seluruh isinya, mohon hentikan penggunaan layanan kami atau hubungi Petugas Perlindungan Data kami.</p>
</div>
</div>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

<aside className="hidden lg:block lg:col-span-4" data-purpose="quick-navigation">
<div className="sticky top-28 space-y-6">

<div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
<h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-2 flex items-center gap-2">
<i className="w-4 h-4 text-slate-400" data-lucide="list"></i>
              Daftar Isi Kebijakan
            </h3>

</div>

<div className="bg-gradient-to-br from-brand-900 to-brand-950 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
<div className="absolute -right-4 -bottom-4 w-28 h-28 bg-brand-700/20 rounded-full blur-xl pointer-events-none" />
<div className="flex items-center gap-2 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-2">
<i className="w-4 h-4" data-lucide="lock"></i>
              DPO Officer
            </div>
<h4 className="font-bold text-base text-white mb-1.5">Pertanyaan Privasi?</h4>
<p className="text-xs text-brand-100/80 mb-4 leading-relaxed">
              Tim Data Protection Officer (DPO) kami siap melayani permintaan hak data Anda dalam 1x24 jam kerja.
            </p>
<a className="inline-flex items-center justify-center w-full gap-2 px-3.5 py-2 rounded-xl bg-white text-brand-950 font-bold text-xs hover:bg-brand-50 transition-colors shadow-xs" href="mailto:hello@jagofarm.id">
<i className="w-3.5 h-3.5 text-brand-800" data-lucide="mail"></i>
<span>Hubungi hello@jagofarm.id</span>
</a>
</div>
</div>
</aside>


<article className="lg:col-span-8 space-y-8">

<section className="scroll-mt-28 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-2xs transition-all hover:shadow-xs" id="section-1">
<div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-100">
<div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-800 font-bold text-sm">
              1
            </div>
<div className="flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-900">
<i className="w-5 h-5 text-brand-700" data-lucide="folder-archive"></i>
<h2>Data yang Kami Kumpulkan</h2>
</div>
</div>
<p className="text-sm text-slate-600 mb-5 leading-relaxed">
            Dalam rangka memberikan pengalaman operasional pertanian modern, transaksi, dan pengiriman peralatan hidroponik maupun IoT, kami mengumpulkan jenis data berikut:
          </p>
<ul className="space-y-3.5 text-sm text-slate-700">
<li className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
<i className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" data-lucide="check-circle-2"></i>
<div>
<strong className="font-semibold text-slate-900">Data identitas dan kontak:</strong>
<span className="text-slate-600">nama lengkap, alamat email aktif, nomor telepon/WhatsApp seluler.</span>
</div>
</li>
<li className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
<i className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" data-lucide="check-circle-2"></i>
<div>
<strong className="font-semibold text-slate-900">Data pengiriman:</strong>
<span className="text-slate-600">alamat lengkap domisili/lokasi tambak/kebun, nama penerima, dan nomor kontak penerima untuk keperluan kurir pengiriman barang logistik.</span>
</div>
</li>
<li className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
<i className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" data-lucide="check-circle-2"></i>
<div>
<strong className="font-semibold text-slate-900">Data akun:</strong>
<span className="text-slate-600">alamat email, kata sandi yang disimpan dalam bentuk terenkripsi satu arah (hash), serta preferensi personalisasi akun Anda.</span>
</div>
</li>
<li className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
<i className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" data-lucide="check-circle-2"></i>
<div>
<strong className="font-semibold text-slate-900">Riwayat pesanan:</strong>
<span className="text-slate-600">produk yang dibeli, kuantitas item, nilai transaksi, metode pembayaran yang dipilih, status transaksi, serta nomor resi pengiriman logistik.</span>
</div>
</li>
<li className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
<i className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" data-lucide="check-circle-2"></i>
<div>
<strong className="font-semibold text-slate-900">Data teknis:</strong>
<span className="text-slate-600">alamat IP, jenis perangkat keras, jenis peramban web (browser), halaman sistem yang dikunjungi, serta data cookie sesi (lihat Bagian 4).</span>
</div>
</li>
<li className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
<i className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" data-lucide="check-circle-2"></i>
<div>
<strong className="font-semibold text-slate-900">Data komunikasi:</strong>
<span className="text-slate-600">isi pesan yang Anda kirimkan melalui formulir kontak kami, percakapan live chat, email bantuan, atau tiket layanan pelanggan.</span>
</div>
</li>
</ul>

<div className="mt-6 p-4 rounded-xl bg-green-50/80 border border-emerald-200 text-xs sm:text-sm text-emerald-900 flex items-start gap-3">
<i className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5" data-lucide="shield-alert"></i>
<div>
<span className="font-bold">Keamanan Finansial:</span> 
              Kami <strong>tidak pernah menyimpan data nomor kartu kredit/debit</strong>, nomor CVV, maupun kredensial perbankan Anda di server kami. Seluruh proses penagihan diproses secara langsung melalui payment gateway resmi berlisensi Bank Indonesia.
            </div>
</div>
</section>

<section className="scroll-mt-28 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-2xs transition-all hover:shadow-xs" id="section-2">
<div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-100">
<div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-800 font-bold text-sm">
              2
            </div>
<div className="flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-900">
<i className="w-5 h-5 text-brand-700" data-lucide="target"></i>
<h2>Tujuan Penggunaan Data</h2>
</div>
</div>
<p className="text-sm text-slate-600 mb-5">
            Kami memproses informasi pribadi Anda hanya untuk tujuan-tujuan yang sah dan transparan berikut ini:
          </p>
<div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-sm">
<div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/40">
<h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
<i className="w-4 h-4 text-brand-600" data-lucide="receipt"></i>
                Pemrosesan Pesanan
              </h4>
<p className="text-slate-600 text-xs leading-relaxed">Memverifikasi transaksi keuangan, menghitung kalkulasi total harga &amp; ongkos kirim, serta menerbitkan konfirmasi faktur pesanan.</p>
</div>
<div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/40">
<h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
<i className="w-4 h-4 text-brand-600" data-lucide="truck"></i>
                Pengiriman Logistik
              </h4>
<p className="text-slate-600 text-xs leading-relaxed">Meneruskan nama, nomor kontak, dan alamat penerima ke kurir ekspedisi agar perlengkapan pertanian tiba tepat waktu.</p>
</div>
<div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/40">
<h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
<i className="w-4 h-4 text-brand-600" data-lucide="headphones"></i>
                Layanan Pelanggan
              </h4>
<p className="text-slate-600 text-xs leading-relaxed">Merespons pertanyaan teknis akuaponik/IoT, konsultasi bibit, menangani keluhan operasional, dan klaim garansi produk.</p>
</div>
<div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/40">
<h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
<i className="w-4 h-4 text-brand-600" data-lucide="shield-check"></i>
                Pencegahan Fraud
              </h4>
<p className="text-slate-600 text-xs leading-relaxed">Mendeteksi transaksi mencurigakan, mencegah pencurian akun, manipulasi voucher promo, serta penyalahgunaan sistem.</p>
</div>
<div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/40">
<h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
<i className="w-4 h-4 text-brand-600" data-lucide="scale"></i>
                Kewajiban Regulasi
              </h4>
<p className="text-slate-600 text-xs leading-relaxed">Menyimpan rekaman catatan transaksi komersial sesuai ketentuan perpajakan dan audit hukum di wilayah Republik Indonesia.</p>
</div>
<div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/40">
<h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
<i className="w-4 h-4 text-brand-600" data-lucide="mail-check"></i>
                Komunikasi &amp; Edukasi
              </h4>
<p className="text-slate-600 text-xs leading-relaxed">Mengirimkan resi otomatis, notifikasi sistem, dan tips pertanian (Anda dapat membatalkan newsletter kapan pun via tombol unsubscribe).</p>
</div>
<div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/40 md:col-span-2">
<h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
<i className="w-4 h-4 text-brand-600" data-lucide="trending-up"></i>
                Peningkatan Layanan Platform
              </h4>
<p className="text-slate-600 text-xs leading-relaxed">Menganalisis pola pembelian agregat tanpa menampilkan identitas personal guna menyempurnakan kurasi katalog, kestabilan server, dan kenyamanan pengguna berbelanja.</p>
</div>
</div>
</section>

<section className="scroll-mt-28 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-2xs transition-all hover:shadow-xs" id="section-3">
<div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-100">
<div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-800 font-bold text-sm">
              3
            </div>
<div className="flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-900">
<i className="w-5 h-5 text-brand-700" data-lucide="users-2"></i>
<h2>Pihak Ketiga yang Terlibat</h2>
</div>
</div>
<p className="text-sm text-slate-600 mb-4 leading-relaxed">
            Kami hanya membagikan data yang diperlukan kepada mitra terpercaya berikut, dan <strong>tidak pernah menjual data pribadi Anda kepada pihak manapun:</strong>
</p>
<div className="space-y-3 text-sm">
<div className="p-3.5 rounded-xl border border-slate-200/70 hover:border-brand-300 transition-colors bg-white">
<div className="flex items-center justify-between mb-1">
<strong className="text-slate-900 font-bold">Midtrans</strong>
<span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium border border-blue-200/50">Payment Gateway</span>
</div>
<p className="text-xs text-slate-600">Pemrosesan pembayaran aman (Virtual Account, QRIS, e-wallet, kartu kredit, dan gerai retail). Menerima data transaksi yang diperlukan sesuai standar kepatuhan PCI-DSS.</p>
</div>
<div className="p-3.5 rounded-xl border border-slate-200/70 hover:border-brand-300 transition-colors bg-white">
<div className="flex items-center justify-between mb-1">
<strong className="text-slate-900 font-bold">Kurir Pengiriman Ekspedisi</strong>
<span className="text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium border border-amber-200/50">Logistik &amp; Kurir</span>
</div>
<p className="text-xs text-slate-600">JNE, SiCepat, AnterAja, POS Indonesia menerima nama, alamat tujuan, dan nomor seluler penerima untuk proses serah terima barang ke alamat Anda.</p>
</div>
<div className="p-3.5 rounded-xl border border-slate-200/70 hover:border-brand-300 transition-colors bg-white">
<div className="flex items-center justify-between mb-1">
<strong className="text-slate-900 font-bold">Supabase</strong>
<span className="text-xs px-2 py-0.5 rounded-md bg-green-50 text-green-700 font-medium border border-emerald-200/50">Database &amp; Autentikasi</span>
</div>
<p className="text-xs text-slate-600">Penyimpanan basis data cloud dengan enkripsi at-rest dan in-transit, serta pengelolaan token autentikasi sesi akun pengguna secara aman.</p>
</div>
<div className="p-3.5 rounded-xl border border-slate-200/70 hover:border-brand-300 transition-colors bg-white">
<div className="flex items-center justify-between mb-1">
<strong className="text-slate-900 font-bold">Resend</strong>
<span className="text-xs px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium border border-purple-200/50">Email Transaksional</span>
</div>
<p className="text-xs text-slate-600">Penyampaian email transaksional otomatis, mencakup konfirmasi pesanan, tautan reset kata sandi, dan nota pembelian.</p>
</div>
<div className="p-3.5 rounded-xl border border-slate-200/70 hover:border-brand-300 transition-colors bg-white">
<div className="flex items-center justify-between mb-1">
<strong className="text-slate-900 font-bold">Penyedia Hosting &amp; Cloud</strong>
<span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">Infrastruktur</span>
</div>
<p className="text-xs text-slate-600">Menjalankan infrastruktur server komputasi web JagoFarm dengan proteksi DDoS dan failover otomatis.</p>
</div>
<div className="p-3.5 rounded-xl border border-slate-200/70 hover:border-brand-300 transition-colors bg-white">
<div className="flex items-center justify-between mb-1">
<strong className="text-slate-900 font-bold">Penyedia Web Analytics</strong>
<span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">Evaluasi Layanan</span>
</div>
<p className="text-xs text-slate-600">Mengukur trafik dan efisiensi antarmuka sistem secara anonim tanpa mencantumkan identitas asli pengguna.</p>
</div>
</div>
<p className="mt-4 text-xs text-slate-500 leading-relaxed italic">
            * Kami juga dapat mengungkapkan data pribadi apabila diwajibkan oleh hukum formal, panggilan peradilan negara, atau permintaan resmi aparat penegak hukum yang berwenang demi menjaga keamanan hukum Republik Indonesia.
          </p>
</section>

<section className="scroll-mt-28 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-2xs transition-all hover:shadow-xs" id="section-4">
<div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-100">
<div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-800 font-bold text-sm">
              4
            </div>
<div className="flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-900">
<i className="w-5 h-5 text-brand-700" data-lucide="cookie"></i>
<h2>Cookie dan Teknologi Serupa</h2>
</div>
</div>
<p className="text-sm text-slate-600 mb-4 leading-relaxed">
            JagoFarm menggunakan cookie dan penyimpanan lokal peramban (local storage) untuk menjaga keandalan fungsionalitas sistem:
          </p>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
<div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
<div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
<i className="w-4 h-4 text-brand-600" data-lucide="key"></i>
                Cookie Sesi &amp; Autentikasi
              </div>
<p className="text-xs text-slate-600 leading-relaxed">Memastikan status login akun Anda tetap aktif saat berpindah navigasi antarhalaman.</p>
</div>
<div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
<div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
<i className="w-4 h-4 text-brand-600" data-lucide="shopping-bag"></i>
                Cookie Keranjang &amp; Wishlist
              </div>
<p className="text-xs text-slate-600 leading-relaxed">Menyimpan daftar produk bibit atau alat pertanian dalam troli agar tidak hilang saat halaman di-refresh.</p>
</div>
<div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
<div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
<i className="w-4 h-4 text-brand-600" data-lucide="sliders"></i>
                Cookie Preferensi
              </div>
<p className="text-xs text-slate-600 leading-relaxed">Menyimpan opsi kurir langganan, filter kategori hidroponik favorit, dan tata letak tampilan yang Anda pilih.</p>
</div>
<div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
<div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
<i className="w-4 h-4 text-brand-600" data-lucide="bar-chart-2"></i>
                Cookie Analytics &amp; Performa
              </div>
<p className="text-xs text-slate-600 leading-relaxed">Memahami halaman tutorial atau katalog apa yang sering dikunjungi agar kami dapat mengoptimalkan kecepatan server.</p>
</div>
</div>
<div className="mt-4 p-3.5 rounded-xl bg-slate-100/70 text-xs text-slate-600">
            Anda dapat menonaktifkan cookie melalui pengaturan peramban web (browser). Namun, perlu diketahui bahwa hal ini dapat menyebabkan beberapa fitur esensial (seperti sesi login, keranjang checkout) tidak berjalan dengan optimal.
          </div>
</section>

<section className="scroll-mt-28 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-2xs transition-all hover:shadow-xs" id="section-5">
<div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-100">
<div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-800 font-bold text-sm">
              5
            </div>
<div className="flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-900">
<i className="w-5 h-5 text-brand-700" data-lucide="archive"></i>
<h2>Retensi Data</h2>
</div>
</div>
<div className="space-y-4 text-sm text-slate-700 leading-relaxed">
<div className="flex items-start gap-3">
<div className="w-2 h-2 rounded-full bg-brand-600 mt-2" />
<p><strong className="text-slate-900">Masa Akun Aktif:</strong> Data akun Anda disimpan selama akun Anda masih berstatus aktif dan digunakan secara berkala.</p>
</div>
<div className="flex items-start gap-3">
<div className="w-2 h-2 rounded-full bg-brand-600 mt-2" />
<p><strong className="text-slate-900">Catatan Transaksi Keuangan:</strong> Data transaksi disimpan paling lama <strong className="text-slate-900 font-semibold">5 (lima) tahun</strong> setelah pesanan selesai, sebagai kewajiban kepatuhan hukum pembukuan, perpajakan, dan mitigasi sengketa.</p>
</div>
<div className="flex items-start gap-3">
<div className="w-2 h-2 rounded-full bg-brand-600 mt-2" />
<p><strong className="text-slate-900">Data Pemasaran / Promo:</strong> Berlangganan newsletter atau pesan promo akan disimpan hingga Anda menyatakan berhenti berlangganan (unsubscribe).</p>
</div>
<div className="flex items-start gap-3">
<div className="w-2 h-2 rounded-full bg-brand-600 mt-2" />
<p><strong className="text-slate-900">Inaktivitas:</strong> Jika akun Anda tidak aktif selama lebih dari <strong className="text-slate-900 font-semibold">24 bulan berturut-turut</strong>, kami berhak menghapus atau menganonimkan data akun Anda, kecuali data yang diwajibkan disimpan menurut regulasi perundang-undangan.</p>
</div>
</div>
</section>

<section className="scroll-mt-28 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-2xs transition-all hover:shadow-xs" id="section-6">
<div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-100">
<div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-800 font-bold text-sm">
              6
            </div>
<div className="flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-900">
<i className="w-5 h-5 text-brand-700" data-lucide="lock"></i>
<h2>Keamanan Data</h2>
</div>
</div>
<div className="space-y-3.5 text-sm text-slate-700">
<div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
<i className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" data-lucide="shield"></i>
<div>
<strong className="font-semibold text-slate-900">Enkripsi Jaringan:</strong> Seluruh lalu lintas transmisi antara browser Anda dan server kami dienkripsi menggunakan protokol standar industri HTTPS/TLS v1.3.
              </div>
</div>
<div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
<i className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" data-lucide="key"></i>
<div>
<strong className="font-semibold text-slate-900">Kriptografi Kata Sandi:</strong> Kata sandi Anda diamankan menggunakan algoritma hashing satu arah yang kuat (salted hash), sehingga tidak dapat dibaca oleh staf kami sekalipun.
              </div>
</div>
<div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
<i className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" data-lucide="user-check"></i>
<div>
<strong className="font-semibold text-slate-900">Akses Terbatas (Least Privilege):</strong> Akses ke basis data hanya diberikan kepada personil internal berwenang yang memerlukan akses tersebut, diautentikasi dengan multi-factor authentication (MFA) yang diaudit berkala.
              </div>
</div>
<div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
<i className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" data-lucide="credit-card"></i>
<div>
<strong className="font-semibold text-slate-900">Standar PCI-DSS:</strong> Pembayaran diproses dengan enkripsi end-to-end melalui Midtrans dengan sertifikasi ketat internasional.
              </div>
</div>
</div>
<p className="mt-4 text-xs text-slate-500 leading-relaxed">
            Meskipun kami menerapkan proteksi teruji, perlu dipahami bahwa tidak ada metode transmisi internet yang 100% kebal. Kami mengimbau Anda senantiasa menjaga kerahasiaan kata sandi akun dan tidak membagikannya kepada siapa pun.
          </p>
</section>

<section className="scroll-mt-28 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-2xs transition-all hover:shadow-xs" id="section-7">
<div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-100">
<div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-800 font-bold text-sm">
              7
            </div>
<div className="flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-900">
<i className="w-5 h-5 text-brand-700" data-lucide="user-cog"></i>
<h2>Hak Anda atas Data Pribadi</h2>
</div>
</div>
<p className="text-sm text-slate-600 mb-4">
            Berdasarkan UU Pelindungan Data Pribadi (UU PDP), Anda memiliki hak-hak mutlak berikut atas data Anda:
          </p>
<div className="space-y-3 text-sm mb-6">
<div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
<strong className="text-slate-900 font-semibold">1. Hak Akses:</strong>
<span className="text-slate-600"> Meminta salinan dan ringkasan data pribadi Anda yang kami simpan.</span>
</div>
<div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
<strong className="text-slate-900 font-semibold">2. Hak Koreksi:</strong>
<span className="text-slate-600"> Memperbaiki informasi alamat atau identitas yang tidak akurat kapan saja melalui menu Profil Pengguna.</span>
</div>
<div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
<strong className="text-slate-900 font-semibold">3. Hak Penghapusan (Right to be Forgotten):</strong>
<span className="text-slate-600"> Meminta penghapusan permanen akun dan riwayat profil, sejauh tidak bertentangan dengan kewajiban retensi perpajakan negara.</span>
</div>
<div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
<strong className="text-slate-900 font-semibold">4. Hak Menarik Persetujuan:</strong>
<span className="text-slate-600"> Menolak email buletin atau materi promosi kapan pun melalui pengaturan notifikasi atau tombol opt-out.</span>
</div>
<div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
<strong className="text-slate-900 font-semibold">5. Hak Keberatan dan Pembatasan:</strong>
<span className="text-slate-600"> Menolak pemrosesan data tertentu, seperti penargetan analytics demografi.</span>
</div>
</div>

<div className="p-4 rounded-xl bg-brand-50/80 border border-brand-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
<div className="text-xs text-brand-950">
<p className="font-bold mb-0.5">Ingin Mengajukan Permintaan Hak Data?</p>
<p className="text-slate-600">Permintaan akan kami verifikasi dan ditindaklanjuti selambat-lambatnya dalam kurun waktu <strong>14 hari kerja</strong>.</p>
</div>
<a className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand-900 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shadow-xs" href="mailto:hello@jagofarm.id?subject=Permintaan%20Data%20Pribadi%20-%20JagoFarm">
<i className="w-3.5 h-3.5" data-lucide="send"></i>
<span>Kirim Permintaan</span>
</a>
</div>
</section>

<section className="scroll-mt-28 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-2xs transition-all hover:shadow-xs" id="section-8">
<div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-100">
<div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-800 font-bold text-sm">
              8
            </div>
<div className="flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-900">
<i className="w-5 h-5 text-brand-700" data-lucide="shield-alert"></i>
<h2>Data Anak-anak</h2>
</div>
</div>
<p className="text-sm text-slate-600 leading-relaxed">
            Layanan JagoFarm tidak ditujukan untuk anak di bawah usia 18 tahun. Kami tidak secara sengaja mengumpulkan maupun menyimpan data pribadi milik anak-anak. Jika Anda selaku orang tua atau wali mengetahui bahwa anak Anda mendaftarkan data di platform kami tanpa izin wali, mohon hubungi kami segera agar data dapat kami hapus dari database kami. Pembelian paket kit hidroponik untuk edukasi anak harus dilakukan dengan pengawasan langsung orang tua/wali sah.
          </p>
</section>

<section className="scroll-mt-28 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-2xs transition-all hover:shadow-xs" id="section-9">
<div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-100">
<div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-800 font-bold text-sm">
              9
            </div>
<div className="flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-900">
<i className="w-5 h-5 text-brand-700" data-lucide="refresh-cw"></i>
<h2>Perubahan Kebijakan Privasi</h2>
</div>
</div>
<p className="text-sm text-slate-600 leading-relaxed">
            Kami dapat memperbarui kebijakan privasi ini secara berkala seiring perkembangan fitur sistem, teknologi pendukung, maupun penyesuaian regulasi hukum yang berlaku. Versi mutakhir selalu kami publikasikan di tautan ini beserta tanggal pembaruan tercatat. Apabila terdapat pembaruan material yang substansial, kami akan memberitahukan Anda melalui surel (email) resmi atau maklumat pengumuman di beranda situs.
          </p>
</section>

<section className="scroll-mt-28 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-2xs transition-all hover:shadow-xs" id="section-10">
<div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-100">
<div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-800 font-bold text-sm">
              10
            </div>
<div className="flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-900">
<i className="w-5 h-5 text-brand-700" data-lucide="mail"></i>
<h2>Kontak untuk Permintaan Data</h2>
</div>
</div>
<p className="text-sm text-slate-600 mb-5 leading-relaxed">
            Pertanyaan, saran, keberatan, atau permintaan resmi terkait hak perlindungan data pribadi Anda dapat dialamatkan ke Petugas Perlindungan Data (DPO) kami:
          </p>

<div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/70 border border-slate-200 space-y-4 text-sm">
<div className="font-bold text-base text-brand-950 flex items-center gap-2">
<i className="w-5 h-5 text-brand-700" data-lucide="building-2"></i>
<span>JagoFarm — Divisi Perlindungan Data Pribadi</span>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-700 pt-2 border-t border-slate-200/80">
<div>
<span className="text-slate-400 block text-xs uppercase font-semibold mb-0.5">Surel Resmi (DPO)</span>
<a className="text-brand-800 font-medium hover:underline flex items-center gap-1.5" href="mailto:hello@jagofarm.id">
<i className="w-4 h-4 text-slate-400" data-lucide="at-sign"></i>
                  hello@jagofarm.id
                </a>
</div>
<div>
<span className="text-slate-400 block text-xs uppercase font-semibold mb-0.5">Telepon &amp; WhatsApp</span>
<a className="text-slate-800 font-medium flex items-center gap-1.5" href="tel:+6281234567890">
<i className="w-4 h-4 text-slate-400" data-lucide="phone"></i>
                  +62 812-3456-7890
                </a>
<span className="text-[11px] text-slate-500">(Setiap hari 08.00 – 20.00 WIB)</span>
</div>
<div className="md:col-span-2">
<span className="text-slate-400 block text-xs uppercase font-semibold mb-0.5">Alamat Kantor Operasional</span>
<p className="text-slate-700 font-medium flex items-start gap-1.5">
<i className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" data-lucide="map-pin"></i>
                  Jl. Pertanian No. 123, Sukolilo, Surabaya, Jawa Timur 60111, Indonesia.
                </p>
</div>
</div>
</div>
<p className="mt-4 text-xs text-slate-500 leading-relaxed">
            Anda juga berhak menyampaikan laporan atau pengaduan terkait pelaksanaan perlindungan data pribadi kepada Komisi Perlindungan Data Pribadi Republik Indonesia sesuai ketentuan perundang-undangan nasional.
          </p>
</section>

<div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200 text-xs text-slate-500 leading-relaxed flex items-start gap-3">
<i className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" data-lucide="alert-circle"></i>
<div>
<strong>Catatan Hukum:</strong> Dokumen ini disusun sebagai informasi umum mengenai tata kelola data pribadi dan bukan merupakan nasihat hukum formal pengganti konsultan hukum tersumpah. Kebijakan lain yang saling melengkapi mencakup:
            <a className="text-brand-800 font-medium underline" href="#">Kebijakan Pengiriman</a>,
            <a className="text-brand-800 font-medium underline" href="#">Kebijakan Pengembalian &amp; Refund</a>, dan
            <a className="text-brand-800 font-medium underline" href="#">Syarat dan Ketentuan Layanan</a>.
          </div>
</div>
</article>

</div>`}} />
  );
}

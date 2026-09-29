import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Syarat dan Ketentuan - JagoFarm" };

const LAST_UPDATED = "24 September 2026";

function Section({ num, icon, title, children }: { num: number; icon: string; title: string; children: ReactNode }) {
  return (
    <Card className="border-emerald-100 shadow-sm">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">{num}</span>
          <Icon name={icon} size={20} className="shrink-0 text-emerald-600" />
          {title}
        </h2>
        <div className="mt-4 space-y-3 text-sm text-gray-600 leading-relaxed">{children}</div>
      </CardContent>
    </Card>
  );
}

function Bullet({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${accent ? "bg-amber-500" : "bg-emerald-600"}`} />
      <span>{children}</span>
    </div>
  );
}

export default function TermsPage() {
  return (
    <>
      <section className="relative pt-16 pb-12 bg-gradient-to-b from-white to-[#FAFBFB]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-sm font-semibold mb-6 shadow-sm">
            <Icon name="description" size={16} className="text-emerald-600" />
            <span>Ketentuan</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Syarat dan Ketentuan</h1>
          <p className="text-lg text-gray-600">Aturan penggunaan situs dan layanan JagoFarm</p>
          <p className="mt-3 text-sm text-gray-500">Terakhir diperbarui: <strong>{LAST_UPDATED}</strong></p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-gray-600 leading-relaxed">
          Syarat dan Ketentuan ini merupakan perjanjian antara Anda (&quot;Pengguna&quot;) dan JagoFarm. Dengan mengakses situs, membuat akun, atau melakukan pemesanan, Anda dianggap telah membaca, memahami, dan menyetujui seluruh ketentuan di bawah ini.
        </div>

        <div className="mt-10 space-y-8">
          <Section num={1} icon="person_check" title="Kelayakan Penggunaan Akun">
            <Bullet>Anda harus berusia minimal <strong>18 tahun</strong> atau telah cakap hukum untuk membuat akun dan melakukan transaksi.</Bullet>
            <Bullet>Data yang Anda daftarkan harus benar, lengkap, dan terkini. Kerugian akibat data yang salah menjadi tanggung jawab Pengguna.</Bullet>
            <Bullet>Satu akun hanya untuk satu pengguna. Anda bertanggung jawab menjaga kerahasiaan kata sandi.</Bullet>
            <Bullet>Kami berhak menolak, menangguhkan, atau menutup akun yang terindikasi melakukan penipuan atau pelanggaran.</Bullet>
          </Section>

          <Section num={2} icon="info" title="Akurasi Informasi Produk dan Harga">
            <Bullet>Kami berupaya menampilkan deskripsi, spesifikasi, dan foto produk seakurat mungkin. Foto bersifat ilustrasi.</Bullet>
            <Bullet>Semua harga tercantum dalam <strong>Rupiah (IDR)</strong> dan dapat berubah tanpa pemberitahuan sebelumnya.</Bullet>
            <Bullet>Stok bersifat terbatas. Bila produk tidak tersedia, kami akan menghubungi Anda untuk opsi penggantian atau refund penuh.</Bullet>
            <Bullet>Bila terjadi kekeliruan harga yang jelas tidak wajar, kami berhak membatalkan pesanan dan mengembalikan dana penuh.</Bullet>
          </Section>

          <Section num={3} icon="payments" title="Proses Pemesanan dan Pembayaran">
            <Bullet>Pesanan yang masuk merupakan permintaan pembelian. Perjanjian jual beli terbentuk setelah pembayaran dikonfirmasi.</Bullet>
            <Bullet>Pembayaran diproses melalui <strong>Midtrans/Mayar</strong>: transfer bank, QRIS, e-wallet, kartu kredit.</Bullet>
            <Bullet>Pesanan harus dibayar dalam <strong>24 jam</strong> setelah checkout. Pesanan yang melewati batas waktu akan dibatalkan otomatis.</Bullet>
            <Bullet>Kami tidak menyimpan data kartu kredit/debit Anda.</Bullet>
          </Section>

          <Section num={4} icon="local_shipping" title="Pengiriman dan Risiko">
            <Bullet>Pengiriman dilakukan melalui JNE, SiCepat, AnterAja. Pilihan kurir dan estimasi tersedia saat checkout.</Bullet>
            <Bullet>Risiko kerusakan atau kehilangan barang berpindah kepada Pengguna setelah pesanan berstatus terkirim.</Bullet>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <h3 className="text-base font-semibold flex items-center gap-2 text-gray-900">
                <Icon name="set_meal" size={20} className="text-amber-600" /> Ketentuan Khusus Anakan Ikan
              </h3>
              <div className="mt-3 space-y-2">
                <Bullet accent>Anakan ikan <strong>hanya dikirim ke wilayah Pulau Jawa</strong>.</Bullet>
                <Bullet accent>Pengiriman menggunakan kemasan khusus beroksigen, hanya <strong>Senin — Kamis</strong>.</Bullet>
                <Bullet accent><strong>Garansi ganti 100% bila ikan mati saat pengiriman</strong>. Kirim foto/video dalam 2 jam setelah diterima.</Bullet>
              </div>
            </div>
          </Section>

          <Section num={5} icon="assignment_return" title="Pembatalan dan Refund">
            <Bullet>Pembatalan pesanan dapat dilakukan sebelum pesanan dikirim. Dana akan dikembalikan penuh.</Bullet>
            <Bullet>Produk dapat dikembalikan dalam waktu <strong>7 hari</strong> setelah diterima, dengan syarat kondisi masih asli.</Bullet>
            <Bullet>Klaim diverifikasi dalam <strong>1×24 jam</strong>. Refund masuk dalam <strong>3-5 hari kerja</strong>.</Bullet>
          </Section>

          <Section num={6} icon="block" title="Larangan Penggunaan">
            <p>Anda dilarang menggunakan situs dan layanan JagoFarm untuk:</p>
            <Bullet>Scraping, crawling, atau bot tanpa izin tertulis.</Bullet>
            <Bullet>Menyebarkan virus, malware, atau melakukan peretasan.</Bullet>
            <Bullet>Membuat akun palsu atau menyamar sebagai pihak lain.</Bullet>
            <Bullet>Menulis ulasan palsu atau menyalahgunakan kupon/promo.</Bullet>
          </Section>

          <Section num={7} icon="gavel" title="Batasan Tanggung Jawab">
            <Bullet>Tanggung jawab kami dibatasi maksimal sebesar nilai transaksi yang bersangkutan.</Bullet>
            <Bullet>Kami tidak bertanggung jawab atas kerugian tidak langsung atau force majeure.</Bullet>
            <Bullet>Kami tidak menjamin hasil budidaya. Keberhasilan panen bergantung pada perawatan Pengguna.</Bullet>
          </Section>

          <Section num={8} icon="refresh" title="Perubahan Syarat dan Ketentuan">
            <p>Kami dapat mengubah Syarat dan Ketentuan ini dari waktu ke waktu. Versi terbaru berlaku sejak dipublikasikan di halaman ini.</p>
          </Section>

          <Section num={9} icon="gavel" title="Hukum yang Berlaku">
            <Bullet>Syarat dan Ketentuan ini tunduk pada <strong>hukum Republik Indonesia</strong>.</Bullet>
            <Bullet>Perselisihan diselesaikan melalui pengadilan negeri yang berwenang di Surabaya, Jawa Timur.</Bullet>
          </Section>

          <Section num={10} icon="mail" title="Hubungi Kami">
            <p>Pertanyaan mengenai Syarat dan Ketentuan ini dapat disampaikan melalui <Link href="/contact" className="font-medium text-primary hover:underline">Hubungi Kami</Link> atau:</p>
            <div className="rounded-xl border border-emerald-100 p-4">
              <p className="font-semibold text-gray-900">JagoFarm Customer Service</p>
              <p className="mt-1">Email: hello@jagofarm.id</p>
              <p>WhatsApp: +62 812-3456-7890 (setiap hari 08.00 - 20.00 WIB)</p>
            </div>
          </Section>
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm text-gray-600 leading-relaxed">
          <Icon name="warning" size={16} className="shrink-0 mt-0.5 text-amber-600" />
          <p>
            <strong>Catatan:</strong> dokumen ini disusun sebagai informasi umum dan <strong>bukan merupakan nasihat hukum</strong>.
            Ketentuan terkait:{" "}
            <Link href="/shipping-policy" className="font-medium text-primary hover:underline">Kebijakan Pengiriman</Link>,{" "}
            <Link href="/return-policy" className="font-medium text-primary hover:underline">Kebijakan Pengembalian</Link>,{" "}
            <Link href="/privacy-policy" className="font-medium text-primary hover:underline">Kebijakan Privasi</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
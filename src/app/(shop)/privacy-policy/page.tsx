import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Kebijakan Privasi - JagoFarm" };

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

function Bullet({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <section className="relative pt-16 pb-12 bg-gradient-to-b from-white to-[#FAFBFB]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-sm font-semibold mb-6 shadow-sm">
            <Icon name="shield" size={16} className="text-emerald-600" />
            <span>Privasi</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Kebijakan Privasi</h1>
          <p className="text-lg text-gray-600">Bagaimana JagoFarm mengumpulkan, menggunakan, dan melindungi data pribadi Anda</p>
          <p className="mt-3 text-sm text-gray-500">Terakhir diperbarui: <strong>{LAST_UPDATED}</strong></p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-gray-600 leading-relaxed">
          Dengan membuat akun, berbelanja, atau menggunakan layanan JagoFarm, Anda menyetujui
          praktik yang dijelaskan dalam dokumen ini. Bila Anda tidak menyetujui sebagian atau
          seluruh isinya, mohon hentikan penggunaan layanan kami.
        </div>

        <div className="mt-10 space-y-8">
          <Section num={1} icon="storage" title="Data yang Kami Kumpulkan">
            <Bullet><strong>Data identitas dan kontak:</strong> nama lengkap, alamat email, nomor telepon/WhatsApp.</Bullet>
            <Bullet><strong>Data pengiriman:</strong> alamat lengkap, nama penerima, dan nomor telepon penerima untuk keperluan pengiriman barang.</Bullet>
            <Bullet><strong>Data akun:</strong> alamat email, kata sandi yang disimpan dalam bentuk terenkripsi (hash), serta preferensi akun Anda.</Bullet>
            <Bullet><strong>Riwayat pesanan:</strong> produk yang dibeli, jumlah, nilai transaksi, metode pembayaran, status pembayaran, dan status pengiriman.</Bullet>
            <Bullet><strong>Data teknis:</strong> alamat IP, jenis perangkat dan peramban, halaman yang dikunjungi, serta data cookie.</Bullet>
            <Bullet><strong>Data komunikasi:</strong> isi pesan yang Anda kirim melalui formulir kontak, email, atau layanan pelanggan.</Bullet>
            <p>Kami <strong>tidak menyimpan data kartu kredit/debit</strong> maupun kredensial perbankan Anda. Seluruh data pembayaran diproses langsung oleh penyedia pembayaran kami.</p>
          </Section>

          <Section num={2} icon="gps_fixed" title="Tujuan Penggunaan Data">
            <Bullet><strong>Pemrosesan pesanan:</strong> memverifikasi pesanan, menghitung total pembayaran, serta menerbitkan konfirmasi pesanan.</Bullet>
            <Bullet><strong>Pengiriman:</strong> meneruskan nama, alamat, dan nomor telepon kepada kurir agar barang sampai ke tangan Anda.</Bullet>
            <Bullet><strong>Layanan pelanggan:</strong> merespons pertanyaan, menangani keluhan, klaim garansi, dan proses pengembalian dana.</Bullet>
            <Bullet><strong>Keamanan dan pencegahan penyalahgunaan:</strong> mendeteksi transaksi mencurigakan, aktivitas penipuan, dan penyalahgunaan akun atau kupon.</Bullet>
            <Bullet><strong>Pemenuhan kewajiban hukum:</strong> menyimpan catatan transaksi untuk keperluan pajak dan audit sesuai ketentuan yang berlaku di Indonesia.</Bullet>
            <Bullet><strong>Komunikasi dan pemasaran:</strong> mengirim informasi pesanan, newsletter, atau promo. Anda dapat berhenti berlangganan kapan saja.</Bullet>
          </Section>

          <Section num={3} icon="people" title="Pihak Ketiga yang Terlibat">
            <p>Kami hanya membagikan data yang diperlukan kepada mitra berikut, dan tidak pernah menjual data pribadi Anda kepada pihak lain:</p>
            <Bullet><strong>Midtrans/Mayar</strong> — pemrosesan pembayaran. Menerima data transaksi dan data kontak yang diperlukan.</Bullet>
            <Bullet><strong>Kurir pengiriman</strong> (JNE, SiCepat, AnterAja) — menerima nama, alamat, dan nomor telepon penerima.</Bullet>
            <Bullet><strong>Supabase</strong> — penyimpanan basis data dan layanan autentikasi akun pengguna.</Bullet>
            <Bullet><strong>Resend</strong> — pengiriman email transaksional seperti konfirmasi pesanan dan pemulihan kata sandi.</Bullet>
          </Section>

          <Section num={4} icon="cookie" title="Cookie dan Teknologi Serupa">
            <Bullet>Cookie sesi dan login, agar Anda tetap masuk saat berpindah halaman.</Bullet>
            <Bullet>Cookie keranjang belanja dan daftar keinginan, agar isi keranjang tidak hilang saat Anda meninggalkan situs.</Bullet>
            <Bullet>Cookie preferensi, misalnya pilihan kurir atau tampilan yang terakhir digunakan.</Bullet>
            <p>Anda dapat menonaktifkan cookie melalui pengaturan peramban. Menonaktifkan cookie dapat membuat sebagian fitur tidak berfungsi dengan baik.</p>
          </Section>

          <Section num={5} icon="inventory_2" title="Retensi Data">
            <Bullet>Data akun disimpan selama akun Anda masih aktif dan digunakan.</Bullet>
            <Bullet>Data transaksi disimpan paling lama <strong>5 tahun</strong> setelah transaksi terakhir, untuk keperluan akuntansi dan pajak.</Bullet>
            <Bullet>Jika akun tidak aktif lebih dari <strong>24 bulan</strong>, kami dapat menghapus atau menganonimkan data akun tersebut.</Bullet>
          </Section>

          <Section num={6} icon="lock" title="Keamanan Data">
            <Bullet>Seluruh lalu lintas data dienkripsi menggunakan HTTPS/TLS.</Bullet>
            <Bullet>Kata sandi disimpan dalam bentuk hash (terenkripsi satu arah).</Bullet>
            <Bullet>Akses ke basis data dibatasi hanya untuk personel yang membutuhkannya.</Bullet>
            <Bullet>Pembayaran diproses oleh Midtrans/Mayar dengan standar keamanan industri.</Bullet>
          </Section>

          <Section num={7} icon="person_check" title="Hak Anda atas Data Pribadi">
            <Bullet><strong>Hak akses:</strong> meminta salinan data pribadi yang kami simpan.</Bullet>
            <Bullet><strong>Hak koreksi:</strong> memperbaiki data yang tidak akurat melalui halaman akun.</Bullet>
            <Bullet><strong>Hak penghapusan:</strong> meminta penghapusan akun dan data pribadi.</Bullet>
            <Bullet><strong>Hak menarik persetujuan:</strong> berhenti berlangganan email promo kapan saja.</Bullet>
            <p>Permintaan dapat diajukan melalui <Link href="/contact" className="font-medium text-primary hover:underline">Hubungi Kami</Link> atau email ke <strong>hello@jagofarm.id</strong>.</p>
          </Section>

          <Section num={8} icon="refresh" title="Perubahan Kebijakan Privasi">
            <p>Kami dapat memperbarui kebijakan ini seiring perubahan layanan, teknologi, atau ketentuan hukum. Versi terbaru selalu tersedia di halaman ini.</p>
          </Section>

          <Section num={9} icon="mail" title="Kontak untuk Permintaan Data">
            <p>Pertanyaan, keberatan, atau permintaan terkait data pribadi dapat disampaikan ke:</p>
            <div className="rounded-xl border border-emerald-100 p-4">
              <p className="font-semibold text-gray-900">JagoFarm — Perlindungan Data Pribadi</p>
              <p className="mt-1">Email: hello@jagofarm.id</p>
              <p>WhatsApp: +62 812-3456-7890 (setiap hari 08.00 - 20.00 WIB)</p>
              <p>Alamat: Jl. Pertanian No. 123, Surabaya, Jawa Timur 60111</p>
            </div>
          </Section>
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm text-gray-600 leading-relaxed">
          <Icon name="info" size={16} className="shrink-0 mt-0.5 text-emerald-600" />
          <p>
            <strong>Catatan:</strong> dokumen ini disusun sebagai informasi umum dan <strong>bukan merupakan nasihat hukum</strong>.
            Kebijakan terkait:{" "}
            <Link href="/shipping-policy" className="font-medium text-primary hover:underline">Kebijakan Pengiriman</Link>,{" "}
            <Link href="/return-policy" className="font-medium text-primary hover:underline">Kebijakan Pengembalian</Link>,{" "}
            <Link href="/terms" className="font-medium text-primary hover:underline">Syarat dan Ketentuan</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
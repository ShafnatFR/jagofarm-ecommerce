import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  ShieldCheck,
  Database,
  Target,
  Users,
  Cookie,
  Archive,
  Lock,
  UserCheck,
  RefreshCw,
  Mail,
  Info,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Kebijakan Privasi - JagoFarm" };

const LAST_UPDATED = "24 September 2026";

type IconType = ComponentType<{ className?: string }>;

function Section({
  num,
  icon: Icon,
  title,
  children,
}: {
  num: number;
  icon: IconType;
  title: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            {num}
          </span>
          <Icon className="h-5 w-5 shrink-0 text-primary" />
          {title}
        </h2>
        <div className="mt-4 space-y-3 text-sm text-muted-foreground leading-relaxed">{children}</div>
      </CardContent>
    </Card>
  );
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
          <ShieldCheck className="h-4 w-4" /> Privasi
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Kebijakan Privasi</h1>
        <p className="mt-2 text-muted-foreground">
          Bagaimana JagoFarm mengumpulkan, menggunakan, dan melindungi data pribadi Anda
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Terakhir diperbarui: <strong>{LAST_UPDATED}</strong>
        </p>
      </div>

      <div className="mt-6 rounded-xl bg-primary/5 p-4 text-sm text-muted-foreground leading-relaxed">
        Dengan membuat akun, berbelanja, atau menggunakan layanan JagoFarm, Anda menyetujui
        praktik yang dijelaskan dalam dokumen ini. Bila Anda tidak menyetujui sebagian atau
        seluruh isinya, mohon hentikan penggunaan layanan kami.
      </div>

      <div className="mt-10 space-y-8">
        <Section num={1} icon={Database} title="Data yang Kami Kumpulkan">
          <Bullet>
            <strong>Data identitas dan kontak:</strong> nama lengkap, alamat email, nomor
            telepon/WhatsApp.
          </Bullet>
          <Bullet>
            <strong>Data pengiriman:</strong> alamat lengkap, nama penerima, dan nomor telepon
            penerima untuk keperluan pengiriman barang.
          </Bullet>
          <Bullet>
            <strong>Data akun:</strong> alamat email, kata sandi yang disimpan dalam bentuk
            terenkripsi (hash), serta preferensi akun Anda.
          </Bullet>
          <Bullet>
            <strong>Riwayat pesanan:</strong> produk yang dibeli, jumlah, nilai transaksi,
            metode pembayaran, status pembayaran, dan status pengiriman.
          </Bullet>
          <Bullet>
            <strong>Data teknis:</strong> alamat IP, jenis perangkat dan peramban, halaman yang
            dikunjungi, serta data cookie (lihat bagian 4).
          </Bullet>
          <Bullet>
            <strong>Data komunikasi:</strong> isi pesan yang Anda kirim melalui formulir kontak,
            email, atau layanan pelanggan.
          </Bullet>
          <p>
            Kami <strong>tidak menyimpan data kartu kredit/debit</strong> maupun kredensial
            perbankan Anda. Seluruh data pembayaran diproses langsung oleh penyedia pembayaran
            kami.
          </p>
        </Section>

        <Section num={2} icon={Target} title="Tujuan Penggunaan Data">
          <Bullet>
            <strong>Pemrosesan pesanan:</strong> memverifikasi pesanan, menghitung total
            pembayaran, serta menerbitkan konfirmasi pesanan.
          </Bullet>
          <Bullet>
            <strong>Pengiriman:</strong> meneruskan nama, alamat, dan nomor telepon kepada
            kurir agar barang sampai ke tangan Anda.
          </Bullet>
          <Bullet>
            <strong>Layanan pelanggan:</strong> merespons pertanyaan, menangani keluhan,
            klaim garansi, dan proses pengembalian dana.
          </Bullet>
          <Bullet>
            <strong>Keamanan dan pencegahan penyalahgunaan:</strong> mendeteksi transaksi
            mencurigakan, aktivitas penipuan, dan penyalahgunaan akun atau kupon.
          </Bullet>
          <Bullet>
            <strong>Pemenuhan kewajiban hukum:</strong> menyimpan catatan transaksi untuk
            keperluan pajak dan audit sesuai ketentuan yang berlaku di Indonesia.
          </Bullet>
          <Bullet>
            <strong>Komunikasi dan pemasaran:</strong> mengirim informasi pesanan, newsletter,
            atau promo. Anda dapat berhenti berlangganan kapan saja melalui tautan di email
            atau dengan menghubungi kami.
          </Bullet>
          <Bullet>
            <strong>Peningkatan layanan:</strong> menganalisis pola pembelian dan perilaku
            penggunaan situs secara agregat untuk memperbaiki katalog, harga, dan pengalaman
            belanja.
          </Bullet>
        </Section>

        <Section num={3} icon={Users} title="Pihak Ketiga yang Terlibat">
          <p>
            Kami hanya membagikan data yang diperlukan kepada mitra berikut, dan tidak pernah
            menjual data pribadi Anda kepada pihak lain:
          </p>
          <Bullet>
            <strong>Midtrans</strong> — pemrosesan pembayaran (transfer bank/VA, QRIS, e-wallet,
            kartu kredit, dan gerai retail). Midtrans menerima data transaksi dan data kontak
            yang diperlukan sesuai aturan penyedia pembayaran.
          </Bullet>
          <Bullet>
            <strong>Kurir pengiriman</strong> (JNE, SiCepat, AnterAja, POS) — menerima nama,
            alamat, dan nomor telepon penerima untuk mengantar pesanan.
          </Bullet>
          <Bullet>
            <strong>Supabase</strong> — penyimpanan basis data dan layanan autentikasi akun
            pengguna.
          </Bullet>
          <Bullet>
            <strong>Resend</strong> — pengiriman email transaksional seperti konfirmasi pesanan,
            status pembayaran, dan pemulihan kata sandi.
          </Bullet>
          <Bullet>
            <strong>Penyedia hosting</strong> — menjalankan situs dan menyimpan log server
            secara aman.
          </Bullet>
          <Bullet>
            <strong>Penyedia analytics</strong> (bila diaktifkan) — mengukur trafik dan
            perilaku pengunjung secara agregat untuk evaluasi performa situs.
          </Bullet>
          <p>
            Kami juga dapat mengungkapkan data apabila diwajibkan oleh hukum, permintaan resmi
            aparat penegak hukum, atau untuk melindungi hak dan keamanan JagoFarm serta
            pelanggan kami.
          </p>
        </Section>

        <Section num={4} icon={Cookie} title="Cookie dan Teknologi Serupa">
          <Bullet>
            Cookie sesi dan login, agar Anda tetap masuk saat berpindah halaman.
          </Bullet>
          <Bullet>
            Cookie keranjang belanja dan daftar keinginan, agar isi keranjang tidak hilang saat
            Anda meninggalkan situs.
          </Bullet>
          <Bullet>
            Cookie preferensi, misalnya pilihan kurir atau tampilan yang terakhir digunakan.
          </Bullet>
          <Bullet>
            Cookie analytics dan performa, untuk mengetahui halaman yang paling banyak
            dikunjungi dan memperbaiki situs.
          </Bullet>
          <p>
            Anda dapat menonaktifkan cookie melalui pengaturan peramban. Perlu diketahui bahwa
            menonaktifkan cookie dapat membuat sebagian fitur (login, keranjang, checkout) tidak
            berfungsi dengan baik.
          </p>
        </Section>

        <Section num={5} icon={Archive} title="Retensi Data">
          <Bullet>
            Data akun disimpan selama akun Anda masih aktif dan digunakan.
          </Bullet>
          <Bullet>
            Data transaksi dan catatan pembayaran disimpan paling lama <strong>5 tahun</strong>{" "}
            setelah transaksi terakhir, untuk keperluan akuntansi, pajak, dan penanganan
            sengketa.
          </Bullet>
          <Bullet>
            Data pemasaran (langganan email/pesan promo) disimpan sampai Anda berhenti
            berlangganan.
          </Bullet>
          <Bullet>
            Jika akun tidak aktif lebih dari <strong>24 bulan</strong>, kami dapat menghapus
            atau menganonimkan data akun tersebut, kecuali data yang wajib kami simpan menurut
            hukum.
          </Bullet>
        </Section>

        <Section num={6} icon={Lock} title="Keamanan Data">
          <Bullet>
            Seluruh lalu lintas data antara peramban Anda dan situs kami dienkripsi
            menggunakan HTTPS/TLS.
          </Bullet>
          <Bullet>
            Kata sandi disimpan dalam bentuk hash (terenkripsi satu arah), bukan teks asli.
          </Bullet>
          <Bullet>
            Akses ke basis data dibatasi hanya untuk personel yang membutuhkannya, dengan
            kredensial yang dijaga secara berkala.
          </Bullet>
          <Bullet>
            Pembayaran diproses oleh Midtrans dengan standar keamanan industri, sehingga data
            kartu tidak pernah melewati atau disimpan di server kami.
          </Bullet>
          <p>
            Meskipun kami menempuh langkah-langkah di atas, tidak ada metode transmisi atau
            penyimpanan data yang sepenuhnya bebas risiko. Kami mengimbau Anda menjaga
            kerahasiaan kata sandi dan tidak membagikannya kepada siapa pun.
          </p>
        </Section>

        <Section num={7} icon={UserCheck} title="Hak Anda atas Data Pribadi">
          <Bullet>
            <strong>Hak akses:</strong> meminta salinan data pribadi yang kami simpan.
          </Bullet>
          <Bullet>
            <strong>Hak koreksi:</strong> memperbaiki data yang tidak akurat — sebagian besar
            data dapat Anda ubah sendiri melalui halaman akun dan daftar alamat.
          </Bullet>
          <Bullet>
            <strong>Hak penghapusan:</strong> meminta penghapusan akun dan data pribadi, sejauh
            tidak bertentangan dengan kewajiban hukum kami.
          </Bullet>
          <Bullet>
            <strong>Hak menarik persetujuan:</strong> berhenti berlangganan email/pesan promo
            kapan saja tanpa memengaruhi pesanan Anda.
          </Bullet>
          <Bullet>
            <strong>Hak keberatan dan pembatasan:</strong> menolak penggunaan tertentu atas data
            Anda, misalnya untuk keperluan pemasaran.
          </Bullet>
          <p>
            Permintaan dapat diajukan melalui halaman{" "}
            <Link href="/contact" className="font-medium text-primary hover:underline">
              Hubungi Kami
            </Link>{" "}
            atau email ke <strong>hello@jagofarm.id</strong> dengan subjek
            &quot;Permintaan Data Pribadi&quot;. Kami akan memverifikasi identitas pemohon dan
            menindaklanjuti paling lambat <strong>14 hari kerja</strong>. Untuk permintaan
            penghapusan akun, data transaksi tertentu tetap kami simpan sesuai kewajiban hukum.
          </p>
        </Section>

        <Section num={8} icon={Users} title="Data Anak-anak">
          <p>
            Layanan JagoFarm tidak ditujukan untuk anak di bawah 18 tahun. Kami tidak dengan
            sengaja mengumpulkan data pribadi anak. Jika Anda mengetahui adanya data anak yang
            terdaftar tanpa persetujuan orang tua/wali, silakan hubungi kami agar data tersebut
            kami hapus. Pembelian oleh anak di bawah 18 tahun harus dilakukan dengan
            pendampingan dan persetujuan orang tua/wali.
          </p>
        </Section>

        <Section num={9} icon={RefreshCw} title="Perubahan Kebijakan Privasi">
          <p>
            Kami dapat memperbarui kebijakan ini seiring perubahan layanan, teknologi, atau
            ketentuan hukum. Versi terbaru selalu tersedia di halaman ini beserta tanggal
            &quot;Terakhir diperbarui&quot;. Perubahan signifikan akan kami informasikan melalui
            email atau pengumuman di situs.
          </p>
        </Section>

        <Section num={10} icon={Mail} title="Kontak untuk Permintaan Data">
          <p>
            Pertanyaan, keberatan, atau permintaan terkait data pribadi dapat disampaikan ke:
          </p>
          <div className="rounded-xl border border-border p-4">
            <p className="font-semibold text-foreground">JagoFarm — Perlindungan Data Pribadi</p>
            <p className="mt-1">Email: hello@jagofarm.id</p>
            <p>WhatsApp/Telepon: +62 812-3456-7890 (setiap hari 08.00 - 20.00 WIB)</p>
            <p>Alamat: Jl. Pertanian No. 123, Surabaya, Jawa Timur 60111</p>
          </div>
          <p>
            Anda juga berhak menyampaikan keluhan terkait perlindungan data pribadi kepada
            lembaga pengawas yang berwenang di Indonesia.
          </p>
        </Section>
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-xl border border-border bg-secondary/50 p-4 text-sm text-muted-foreground leading-relaxed">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
        <p>
          <strong>Catatan:</strong> dokumen ini disusun sebagai informasi umum mengenai
          pengelolaan data pribadi dan <strong>bukan merupakan nasihat hukum</strong>. Untuk
          kebutuhan kepatuhan yang spesifik, silakan berkonsultasi dengan penasihat hukum yang
          kompeten. Kebijakan lain yang terkait:{" "}
          <Link href="/shipping-policy" className="font-medium text-primary hover:underline">
            Kebijakan Pengiriman
          </Link>
          ,{" "}
          <Link href="/return-policy" className="font-medium text-primary hover:underline">
            Kebijakan Pengembalian &amp; Refund
          </Link>
          , dan{" "}
          <Link href="/terms" className="font-medium text-primary hover:underline">
            Syarat dan Ketentuan
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

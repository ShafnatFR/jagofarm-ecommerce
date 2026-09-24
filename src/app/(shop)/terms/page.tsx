import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  ScrollText,
  UserCheck,
  Info,
  CreditCard,
  Truck,
  Fish,
  RotateCcw,
  Ban,
  Scale,
  RefreshCw,
  Mail,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Syarat dan Ketentuan - JagoFarm" };

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

function Bullet({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span
        className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${accent ? "bg-amber-500" : "bg-primary"}`}
      />
      <span>{children}</span>
    </div>
  );
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
          <ScrollText className="h-4 w-4" /> Ketentuan
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Syarat dan Ketentuan</h1>
        <p className="mt-2 text-muted-foreground">
          Aturan penggunaan situs dan layanan JagoFarm
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Terakhir diperbarui: <strong>{LAST_UPDATED}</strong>
        </p>
      </div>

      <div className="mt-6 rounded-xl bg-primary/5 p-4 text-sm text-muted-foreground leading-relaxed">
        Syarat dan Ketentuan ini merupakan perjanjian antara Anda (&quot;Pengguna&quot;) dan
        JagoFarm. Dengan mengakses situs, membuat akun, atau melakukan pemesanan, Anda dianggap
        telah membaca, memahami, dan menyetujui seluruh ketentuan di bawah ini.
      </div>

      <div className="mt-10 space-y-8">
        <Section num={1} icon={UserCheck} title="Kelayakan Penggunaan Akun">
          <Bullet>
            Anda harus berusia minimal <strong>18 tahun</strong> atau telah cakap hukum untuk
            membuat akun dan melakukan transaksi. Pembelian oleh pihak di bawah umur wajib
            didampingi orang tua/wali.
          </Bullet>
          <Bullet>
            Data yang Anda daftarkan (nama, email, telepon, alamat) harus benar, lengkap, dan
            terkini. Kerugian akibat data yang salah menjadi tanggung jawab Pengguna.
          </Bullet>
          <Bullet>
            Satu akun hanya untuk satu pengguna. Anda bertanggung jawab menjaga kerahasiaan
            kata sandi dan seluruh aktivitas yang terjadi pada akun Anda.
          </Bullet>
          <Bullet>
            Kami berhak menolak, menangguhkan, atau menutup akun yang terindikasi melakukan
            penipuan, penyalahgunaan kupon, atau pelanggaran ketentuan ini.
          </Bullet>
        </Section>

        <Section num={2} icon={Info} title="Akurasi Informasi Produk dan Harga">
          <Bullet>
            Kami berupaya menampilkan deskripsi, spesifikasi, dan foto produk seakurat mungkin.
            Foto bersifat ilustrasi; warna, bentuk, dan ukuran aktual dapat sedikit berbeda,
            terutama untuk produk alami seperti benih dan anakan ikan.
          </Bullet>
          <Bullet>
            Spesifikasi set tambak, hidroponik, akuaponik, dan perangkat IoT dapat berubah
            sewaktu-waktu mengikuti ketersediaan komponen, tanpa mengurangi fungsi utama produk.
          </Bullet>
          <Bullet>
            Semua harga tercantum dalam <strong>Rupiah (IDR)</strong> dan dapat berubah tanpa
            pemberitahuan sebelumnya. Harga yang berlaku adalah harga pada saat pesanan
            dikonfirmasi.
          </Bullet>
          <Bullet>
            Stok bersifat terbatas dan diperbarui secara berkala. Bila produk yang dipesan tidak
            tersedia, kami akan menghubungi Anda untuk opsi penggantian atau pengembalian dana
            penuh.
          </Bullet>
          <Bullet>
            Bila terjadi kekeliruan harga atau informasi yang jelas tidak wajar, kami berhak
            membatalkan pesanan dan mengembalikan dana yang telah Anda bayarkan secara penuh.
          </Bullet>
        </Section>

        <Section num={3} icon={CreditCard} title="Proses Pemesanan dan Pembayaran">
          <Bullet>
            Pesanan yang masuk merupakan permintaan pembelian. Perjanjian jual beli baru
            terbentuk setelah pembayaran dikonfirmasi dan pesanan berstatus diproses.
          </Bullet>
          <Bullet>
            Pembayaran diproses melalui <strong>Midtrans</strong>: transfer bank/VA (BCA,
            Mandiri, BNI, BRI), QRIS, e-wallet (GoPay, OVO, Dana, ShopeePay), kartu kredit, dan
            gerai retail.
          </Bullet>
          <Bullet>
            Pesanan harus dibayar dalam <strong>24 jam</strong> setelah checkout. Pesanan yang
            melewati batas waktu akan dibatalkan otomatis dan stok dikembalikan ke katalog.
          </Bullet>
          <Bullet>
            Biaya tambahan seperti ongkos kirim dihitung berdasarkan berat dan tujuan
            pengiriman, serta ditampilkan saat checkout sebelum Anda melakukan pembayaran.
          </Bullet>
          <Bullet>
            Kami tidak menyimpan data kartu kredit/debit Anda. Seluruh pemrosesan data
            pembayaran dilakukan oleh penyedia pembayaran sesuai standar keamanan industrinya.
          </Bullet>
          <Bullet>
            Konfirmasi pesanan dan status pembayaran dikirim ke email Anda. Pastikan email
            terdaftar aktif agar notifikasi tidak terlewat.
          </Bullet>
        </Section>

        <Section num={4} icon={Truck} title="Pengiriman dan Risiko">
          <Bullet>
            Pengiriman dilakukan melalui JNE, SiCepat, AnterAja, dan POS. Pilihan kurir dan
            estimasi waktu tersedia saat checkout.
          </Bullet>
          <Bullet>
            Ongkos kirim dihitung berdasarkan berat aktual atau berat volumetrik (P × L × T /
            6000), mana yang lebih besar. Ketentuan lengkap ada di{" "}
            <Link href="/shipping-policy" className="font-medium text-primary hover:underline">
              Kebijakan Pengiriman
            </Link>
            .
          </Bullet>
          <Bullet>
            Risiko kerusakan atau kehilangan barang berpindah kepada Pengguna setelah pesanan
            berstatus terkirim/diterima. Mohon periksa kondisi paket saat diterima dan
            dokumentasikan bila ada kerusakan.
          </Bullet>
          <Bullet>
            Keterlambatan yang disebabkan oleh kurir, cuaca, bencana, atau keadaan di luar
            kendali kami bukan merupakan tanggung jawab JagoFarm, namun kami akan membantu
            proses penelusuran dan klaim ke pihak kurir.
          </Bullet>

          <div className="mt-4 rounded-xl border border-amber-300/50 p-4">
            <h3 className="text-base font-semibold flex items-center gap-2 text-foreground">
              <Fish className="h-5 w-5 text-amber-600" /> Ketentuan Khusus Anakan Ikan
            </h3>
            <div className="mt-3 space-y-2">
              <Bullet accent>
                Anakan ikan <strong>hanya dikirim ke wilayah Pulau Jawa</strong> dan tidak
                dilayani untuk pengiriman ke luar Jawa, guna menjaga kelangsungan hidup ikan.
              </Bullet>
              <Bullet accent>
                Pengiriman menggunakan kemasan khusus beroksigen dengan isolasi suhu, memakai
                layanan <strong>SAME DAY / NEXT DAY</strong>, dan hanya dikirim pada{" "}
                <strong>Senin — Kamis</strong> agar tidak tertahan di gudang kurir saat akhir
                pekan.
              </Bullet>
              <Bullet accent>
                Kami memberikan <strong>jaminan ganti 100% bila ikan mati saat pengiriman</strong>
                . Syaratnya: kirimkan <strong>foto/video</strong> ikan mati dalam kemasan asli
                yang belum dibuka, paling lambat <strong>2 jam</strong> setelah paket diterima,
                beserta nomor pesanan ke WhatsApp customer service kami.
              </Bullet>
              <Bullet accent>
                Setelah dibuktikan, kami akan mengirim pengganti atau memproses refund 100%
                sesuai pilihan Anda (lihat{" "}
                <Link href="/return-policy" className="font-medium text-primary hover:underline">
                  Kebijakan Pengembalian &amp; Refund
                </Link>
                ).
              </Bullet>
              <Bullet accent>
                Pastikan alamat benar dan ada orang yang menerima paket. Ikan harus segera
                dipindahkan ke air bersih setelah diterima; kematian yang terjadi setelah ikan
                dimasukkan ke kolam/akuarium pembeli tidak ditanggung JagoFarm.
              </Bullet>
            </div>
          </div>
        </Section>

        <Section num={5} icon={RotateCcw} title="Pembatalan dan Refund">
          <Bullet>
            Pembatalan pesanan dapat dilakukan sebelum pesanan dikirim dengan menghubungi
            customer service. Dana akan dikembalikan penuh.
          </Bullet>
          <Bullet>
            Setelah pesanan dikirim, pembatalan mengikuti mekanisme pengembalian barang sesuai{" "}
            <Link href="/return-policy" className="font-medium text-primary hover:underline">
              Kebijakan Pengembalian &amp; Refund
            </Link>
            .
          </Bullet>
          <Bullet>
            Produk dapat dikembalikan dalam waktu <strong>7 hari</strong> setelah diterima,
            dengan syarat kondisi masih asli, belum digunakan, dan kemasan utuh, atau terbukti
            cacat/salah kirim.
          </Bullet>
          <Bullet>
            Produk berikut <strong>tidak dapat dikembalikan</strong>: benih yang segelnya sudah
            dibuka, anakan ikan yang sudah dimasukkan ke kolam/akuarium pembeli, produk custom
            atau pre-order, serta kerusakan akibat kesalahan penggunaan atau kelalaian pembeli.
          </Bullet>
          <Bullet>
            Klaim diverifikasi dalam <strong>1×24 jam</strong>. Jika disetujui, refund dikirim
            ke rekening/e-wallet yang digunakan saat pembayaran dan masuk dalam{" "}
            <strong>3-5 hari kerja</strong> tergantung metode pembayaran.
          </Bullet>
          <Bullet>
            Biaya ongkos kirim pengembalian ditanggung Pengguna, kecuali klaim disebabkan oleh
            kesalahan kami (salah kirim, cacat pabrik, atau ikan mati saat pengiriman).
          </Bullet>
        </Section>

        <Section num={6} icon={Ban} title="Larangan Penggunaan">
          <p>Anda dilarang menggunakan situs dan layanan JagoFarm untuk hal-hal berikut:</p>
          <Bullet>
            Mengakses atau mengambil data situs secara otomatis (scraping, crawling, bot) tanpa
            izin tertulis dari kami.
          </Bullet>
          <Bullet>
            Menyebarkan virus, malware, atau melakukan upaya peretasan, pembebanan berlebih, dan
            gangguan terhadap sistem kami.
          </Bullet>
          <Bullet>
            Membuat akun palsu, menyamar sebagai pihak lain, atau memberikan data yang menyesatkan.
          </Bullet>
          <Bullet>
            Menulis ulasan palsu, memanipulasi rating, atau menyalahgunakan kupon, voucher, dan
            program promo.
          </Bullet>
          <Bullet>
            Menjual kembali produk kami dengan klaim garansi resmi JagoFarm tanpa perjanjian
            kemitraan tertulis.
          </Bullet>
          <Bullet>
            Segala aktivitas yang melanggar hukum yang berlaku di Indonesia.
          </Bullet>
          <p>
            Pelanggaran terhadap larangan di atas dapat mengakibatkan penangguhan atau penutupan
            akun, pembatalan pesanan, serta tindakan hukum yang diperlukan.
          </p>
        </Section>

        <Section num={7} icon={Scale} title="Batasan Tanggung Jawab">
          <Bullet>
            Tanggung jawab kami atas suatu transaksi dibatasi maksimal sebesar nilai transaksi
            yang bersangkutan.
          </Bullet>
          <Bullet>
            Kami tidak bertanggung jawab atas kerugian tidak langsung, kehilangan keuntungan,
            atau kerugian akibat keterlambatan pengiriman, gangguan layanan pihak ketiga
            (Midtrans, kurir, penyedia hosting), serta force majeure.
          </Bullet>
          <Bullet>
            Kami tidak menjamin hasil budidaya. Keberhasilan panen, pertumbuhan benih, dan
            kelangsungan hidup ikan setelah diterima bergantung pada cara perawatan, kualitas
            air, dan kondisi lingkungan Pengguna.
          </Bullet>
          <Bullet>
            Konten panduan dan konsultasi yang kami berikan bersifat informatif dan tidak
            menggantikan penilaian teknis di lapangan.
          </Bullet>
        </Section>

        <Section num={8} icon={RefreshCw} title="Perubahan Syarat dan Ketentuan">
          <p>
            Kami dapat mengubah Syarat dan Ketentuan ini dari waktu ke waktu untuk menyesuaikan
            dengan perkembangan layanan maupun peraturan yang berlaku. Versi terbaru berlaku
            sejak dipublikasikan di halaman ini beserta tanggal &quot;Terakhir diperbarui&quot;.
            Dengan tetap menggunakan layanan setelah perubahan, Anda dianggap menyetujui versi
            terbaru. Jika Anda tidak menyetujui perubahan tersebut, mohon berhenti menggunakan
            layanan kami.
          </p>
        </Section>

        <Section num={9} icon={Scale} title="Hukum yang Berlaku">
          <Bullet>
            Syarat dan Ketentuan ini tunduk pada dan ditafsirkan menurut <strong>hukum Republik
            Indonesia</strong>.
          </Bullet>
          <Bullet>
            Setiap perselisihan akan diupayakan penyelesaian secara musyawarah dalam waktu 30
            hari. Bila tidak tercapai kesepakatan, perselisihan diselesaikan melalui pengadilan
            negeri yang berwenang di Surabaya, Jawa Timur.
          </Bullet>
          <Bullet>
            Bila terdapat ketentuan yang dinyatakan tidak sah atau tidak dapat dilaksanakan,
            ketentuan lain tetap berlaku penuh.
          </Bullet>
        </Section>

        <Section num={10} icon={Mail} title="Hubungi Kami">
          <p>
            Pertanyaan mengenai Syarat dan Ketentuan ini dapat disampaikan melalui halaman{" "}
            <Link href="/contact" className="font-medium text-primary hover:underline">
              Hubungi Kami
            </Link>{" "}
            atau kontak berikut:
          </p>
          <div className="rounded-xl border border-border p-4">
            <p className="font-semibold text-foreground">JagoFarm Customer Service</p>
            <p className="mt-1">Email: hello@jagofarm.id</p>
            <p>WhatsApp/Telepon: +62 812-3456-7890 (setiap hari 08.00 - 20.00 WIB)</p>
            <p>Alamat: Jl. Pertanian No. 123, Surabaya, Jawa Timur 60111</p>
          </div>
        </Section>
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-xl border border-border bg-secondary/50 p-4 text-sm text-muted-foreground leading-relaxed">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
        <p>
          <strong>Catatan:</strong> dokumen ini disusun sebagai informasi umum mengenai syarat
          penggunaan layanan dan <strong>bukan merupakan nasihat hukum</strong>. Untuk kebutuhan
          kepatuhan yang spesifik, silakan berkonsultasi dengan penasihat hukum yang kompeten.
          Ketentuan terkait lainnya:{" "}
          <Link href="/shipping-policy" className="font-medium text-primary hover:underline">
            Kebijakan Pengiriman
          </Link>
          ,{" "}
          <Link href="/return-policy" className="font-medium text-primary hover:underline">
            Kebijakan Pengembalian &amp; Refund
          </Link>
          , dan{" "}
          <Link href="/privacy-policy" className="font-medium text-primary hover:underline">
            Kebijakan Privasi
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

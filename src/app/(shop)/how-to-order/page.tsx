import { ShoppingCart, MousePointerClick, CreditCard, Package, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Cara Pemesanan - JagoFarm" };

const steps = [
  { num: 1, icon: MousePointerClick, title: "Pilih Produk", desc: "Jelajahi katalog kami dan temukan produk pertanian modern yang sesuai kebutuhan Anda. Filter berdasarkan kategori, harga, atau popularitas." },
  { num: 2, icon: ShoppingCart, title: "Tambah ke Keranjang", desc: "Pilih jumlah yang diinginkan dan klik \"Tambah ke Keranjang\". Anda bisa lanjut berbelanja atau langsung checkout." },
  { num: 3, icon: CreditCard, title: "Checkout", desc: "Masukkan alamat pengiriman, pilih kurir (JNE, SiCepat, AnterAja), dan pilih metode pembayaran yang Anda inginkan." },
  { num: 4, icon: CreditCard, title: "Bayar", desc: "Lakukan pembayaran sesuai metode yang dipilih. Kami menerima transfer bank, e-wallet, dan QRIS. Batas waktu pembayaran 24 jam." },
  { num: 5, icon: Package, title: "Terima Barang", desc: "Pesanan Anda akan diproses dan dikirim. Lacak status pengiriman melalui halaman Pesanan Saya. Barang sampai di depan pintu Anda!" },
];

export default function HowToOrderPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
          <CheckCircle className="h-4 w-4" /> Panduan
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Cara Pemesanan</h1>
        <p className="mt-2 text-muted-foreground">
          Belanja di JagoFarm mudah dan cepat. Ikuti langkah-langkah berikut:
        </p>
      </div>

      <div className="mt-12 space-y-6">
        {steps.map((step, i) => (
          <Card key={step.num}>
            <CardContent className="flex items-start gap-5 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
                {step.num}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <step.icon className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">{step.title}</h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 rounded-2xl bg-primary/5 p-8 text-center">
        <h2 className="text-lg font-semibold">Butuh Bantuan?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Tim customer service kami siap membantu Anda via WhatsApp di{" "}
          <strong>+62 812-3456-7890</strong> setiap hari pukul 08.00 - 20.00 WIB.
        </p>
      </div>
    </div>
  );
}

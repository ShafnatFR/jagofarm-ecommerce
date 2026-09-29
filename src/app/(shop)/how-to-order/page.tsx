import { Icon } from "@/components/ui/icon";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Cara Pemesanan - JagoFarm" };

const steps = [
  { num: 1, icon: "touch_app", title: "Pilih Produk", desc: "Jelajahi katalog kami dan temukan produk pertanian modern yang sesuai kebutuhan Anda. Filter berdasarkan kategori, harga, atau popularitas." },
  { num: 2, icon: "shopping_cart", title: "Tambah ke Keranjang", desc: "Pilih jumlah yang diinginkan dan klik \"Tambah ke Keranjang\". Anda bisa lanjut berbelanja atau langsung checkout." },
  { num: 3, icon: "credit_card", title: "Checkout", desc: "Masukkan alamat pengiriman, pilih kurir (JNE, SiCepat, AnterAja), dan pilih metode pembayaran yang Anda inginkan." },
  { num: 4, icon: "payments", title: "Bayar", desc: "Lakukan pembayaran sesuai metode yang dipilih. Kami menerima transfer bank, e-wallet, dan QRIS. Batas waktu pembayaran 24 jam." },
  { num: 5, icon: "inventory_2", title: "Terima Barang", desc: "Pesanan Anda akan diproses dan dikirim. Lacak status pengiriman melalui halaman Pesanan Saya. Barang sampai di depan pintu Anda!" },
];

export default function HowToOrderPage() {
  return (
    <>
      <section className="relative pt-16 pb-12 bg-gradient-to-b from-white to-[#FAFBFB]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-sm font-semibold mb-6 shadow-sm">
            <Icon name="check_circle" size={16} className="text-emerald-600" />
            <span>Panduan</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Cara Pemesanan
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Belanja di JagoFarm mudah dan cepat. Ikuti langkah-langkah berikut:
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="space-y-6">
          {steps.map((step) => (
            <Card key={step.num} className="border-emerald-100 shadow-sm">
              <CardContent className="flex items-start gap-5 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
                  {step.num}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Icon name={step.icon} size={20} className="text-emerald-600" />
                    <h2 className="text-lg font-semibold text-gray-900">{step.title}</h2>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-emerald-50 border border-emerald-100 p-8 text-center">
          <h2 className="text-lg font-semibold text-gray-900">Butuh Bantuan?</h2>
          <p className="mt-2 text-sm text-gray-600">
            Tim customer service kami siap membantu Anda via WhatsApp di{" "}
            <strong>+62 812-3456-7890</strong> setiap hari pukul 08.00 - 20.00 WIB.
          </p>
        </div>
      </section>
    </>
  );
}
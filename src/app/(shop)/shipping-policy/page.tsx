import { Icon } from "@/components/ui/icon";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Kebijakan Pengiriman - JagoFarm" };

export default function ShippingPolicyPage() {
  return (
    <>
      <section className="relative pt-16 pb-12 bg-gradient-to-b from-white to-[#FAFBFB]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-sm font-semibold mb-6 shadow-sm">
            <Icon name="local_shipping" size={16} className="text-emerald-600" />
            <span>Pengiriman</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            Kebijakan Pengiriman
          </h1>
          <p className="text-lg text-gray-600">Informasi lengkap tentang pengiriman produk JagoFarm</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="space-y-8">
          <Card className="border-emerald-100 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <Icon name="local_shipping" size={20} className="text-emerald-600" /> Kurir yang Tersedia
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {[
                  { name: "JNE", services: "REG, YES, OKE", est: "1-5 hari" },
                  { name: "SiCepat", services: "REG, BEST, HALU", est: "1-4 hari" },
                  { name: "AnterAja", services: "REG, NEXT DAY, SAME DAY", est: "1-3 hari" },
                ].map((c) => (
                  <div key={c.name} className="rounded-xl border border-emerald-100 p-4">
                    <p className="font-semibold text-gray-900">{c.name}</p>
                    <p className="text-sm text-gray-600 mt-1">Layanan: {c.services}</p>
                    <p className="text-sm text-gray-600">Estimasi: {c.est}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900">Biaya Pengiriman</h2>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />Biaya pengiriman dihitung berdasarkan berat barang dan tujuan pengiriman.</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />Ongkir aktual ditampilkan saat checkout setelah Anda memasukkan alamat.</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />Berat volumetrik digunakan jika lebih besar dari berat aktual (P × L × T / 6000).</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 shadow-sm bg-emerald-50/30">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <Icon name="redeem" size={20} className="text-emerald-600" /> Gratis Ongkir
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />Pembelian minimal <strong>Rp500.000</strong> untuk pengiriman ke seluruh Jawa.</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />Pembelian minimal <strong>Rp1.000.000</strong> untuk pengiriman ke luar Jawa.</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />Berlaku untuk layanan REG (estimasi standar).</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-amber-200 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <Icon name="set_meal" size={20} className="text-amber-600" /> Pengiriman Anakan Ikan
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />Anakan ikan dikirim menggunakan kemasan khusus dengan oksigen dan isolasi suhu.</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />Pengiriman hanya dilakukan <strong>Senin — Kamis</strong> untuk menghindari penahanan di gudang kurir saat weekend.</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />Garansi ikan hidup sampai — jika ikan mati dalam perjalanan, kami ganti 100%.</li>
              </ul>
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                <Icon name="warning" size={16} className="shrink-0 mt-0.5" />
                <span>Pastikan alamat pengiriman benar dan ada orang yang menerima. Ikan harus segera dimasukkan ke air bersih setelah diterima.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
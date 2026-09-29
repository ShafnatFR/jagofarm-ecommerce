import { Icon } from "@/components/ui/icon";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Kebijakan Pengembalian - JagoFarm" };

export default function ReturnPolicyPage() {
  return (
    <>
      <section className="relative pt-16 pb-12 bg-gradient-to-b from-white to-[#FAFBFB]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-sm font-semibold mb-6 shadow-sm">
            <Icon name="assignment_return" size={16} className="text-emerald-600" />
            <span>Pengembalian</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            Kebijakan Pengembalian &amp; Refund
          </h1>
          <p className="text-lg text-gray-600">Kepuasan Anda adalah prioritas kami</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="space-y-8">
          <Card className="border-emerald-100 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <Icon name="assignment_return" size={20} className="text-emerald-600" /> Syarat Pengembalian
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />Produk dapat dikembalikan dalam waktu <strong>7 hari</strong> setelah diterima.</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />Produk harus dalam kondisi asli, belum digunakan, dan kemasan masih utuh.</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />Produk cacat atau rusak saat pengiriman (wajib sertakan foto unboxing sebagai bukti).</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />Produk yang dikirim tidak sesuai dengan pesanan.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-amber-200 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <Icon name="warning" size={20} className="text-amber-600" /> Barang yang Tidak Dapat Dikembalikan
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />Benih yang sudah dibuka segelnya.</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />Anakan ikan yang sudah dimasukkan ke kolam/akuarium pembeli.</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />Produk custom atau pre-order.</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />Kerusakan akibat kesalahan penggunaan atau kelalaian pembeli.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-amber-200 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <Icon name="set_meal" size={20} className="text-amber-600" /> Garansi Anakan Ikan Hidup
              </h2>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Kami memberikan garansi 100% ikan hidup sampai tujuan. Jika anakan ikan mati saat pengiriman:
              </p>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />Foto/video ikan yang mati dalam kemasan asli dalam waktu <strong>2 jam</strong> setelah diterima.</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />Kirim bukti ke WhatsApp kami dengan menyertakan nomor pesanan.</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />Kami akan mengirimkan pengganti atau refund 100% sesuai permintaan Anda.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                <Icon name="payments" size={20} className="text-emerald-600" /> Proses Refund
              </h2>
              <ol className="mt-4 space-y-3 text-sm text-gray-600 list-decimal list-inside">
                <li>Hubungi customer service via WhatsApp atau email dengan menyertakan foto/video bukti dan nomor pesanan.</li>
                <li>Tim kami akan memverifikasi dalam 1×24 jam.</li>
                <li>Jika disetujui, refund diproses ke rekening/e-wallet yang Anda gunakan saat pembayaran.</li>
                <li>Refund masuk dalam 3-5 hari kerja (tergantung metode pembayaran).</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
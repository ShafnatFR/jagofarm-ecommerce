import { Icon } from "@/components/ui/icon";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export const metadata = { title: "Tentang Kami - JagoFarm" };

const values = [
  { icon: "gps_fixed", title: "Misi Kami", desc: "Menyediakan peralatan pertanian modern berkualitas tinggi yang terjangkau untuk petani dan penghobi Indonesia, mendukung ketahanan pangan nasional melalui teknologi akuaponik, hidroponik, dan smart farming." },
  { icon: "visibility", title: "Visi Kami", desc: "Menjadi platform e-commerce pertanian modern terdepan di Indonesia yang memberdayakan setiap individu untuk bercocok tanam secara mandiri, efisien, dan berkelanjutan." },
  { icon: "eco", title: "Nilai Kami", desc: "Kualitas, inovasi, dan keberlanjutan adalah tiga pilar utama JagoFarm. Kami percaya bahwa pertanian modern adalah kunci masa depan pangan Indonesia." },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-16 pb-20 overflow-hidden bg-gradient-to-b from-white via-emerald-50/20 to-[#FAFBFB]">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-emerald-100/40 blur-3xl -z-10 rounded-full pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
            <Icon name="eco" size={16} filled className="text-emerald-600" />
            <span>Tentang JagoFarm</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
            Membangun Pertanian &amp; Akuakultur Modern Indonesia
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
            JagoFarm hadir sejak 2020 sebagai solusi <em>one-stop</em> untuk kebutuhan pertanian modern.
            Dari set tambak, hidroponik, akuaponik, hingga IoT smart farming — kami menyediakan
            produk berkualitas dengan harga terjangkau untuk semua kalangan.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-12 pt-8 border-t border-gray-200/70 max-w-3xl mx-auto">
            {[
              { value: "5+ Tahun", label: "Dedikasi & Pengalaman" },
              { value: "15.000+", label: "Petani & Pembudidaya" },
              { value: "99.8%", label: "Tingkat Kepuasan" },
              { value: "34 Provinsi", label: "Jangkauan Pengiriman" },
            ].map((s) => (
              <div key={s.label} className="p-3 text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-800">{s.value}</div>
                <div className="text-xs sm:text-sm font-medium text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-8 lg:grid-cols-2 items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Cerita Kami</h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Berawal dari sebuah garasi kecil di Surabaya, tim kami yang terdiri dari
              engineer dan pecinta pertanian mulai merakit set hidroponik pertama. Respons
              yang luar biasa dari komunitas mendorong kami untuk terus berinovasi.
            </p>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Kini, JagoFarm telah melayani ribuan pelanggan di seluruh Indonesia dengan
              produk-produk yang dirancang khusus untuk kondisi tropis Indonesia. Kami juga
              menyediakan benih, anakan ikan, dan peralatan IoT untuk smart farming.
            </p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-amber-50/30 p-8 flex items-center justify-center min-h-[300px] border border-emerald-100">
            <div className="text-center">
              <Icon name="eco" size={80} className="text-emerald-200 mx-auto" />
              <p className="mt-4 text-sm text-gray-500">Foto tim &amp; workshop</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-emerald-50/30 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-2xl font-bold text-center text-gray-900">Nilai-Nilai Kami</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {values.map((v) => (
              <Card key={v.title} className="border-emerald-100 shadow-sm">
                <CardContent className="pt-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                    <Icon name={v.icon} size={24} className="text-emerald-700" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{v.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{v.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="rounded-2xl bg-primary p-8 text-center text-primary-foreground sm:p-12">
          <h2 className="text-2xl font-bold sm:text-3xl">Butuh Konsultasi?</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
            Tim ahli JagoFarm siap membantu merancang sistem pertanian modern
            yang sesuai dengan kebutuhan dan budget Anda.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/products" className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-amber-400 transition-colors">
              <Icon name="shopping_bag" size={18} /> Mulai Belanja
            </Link>
            <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
              <Icon name="chat" size={18} /> Chat via WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
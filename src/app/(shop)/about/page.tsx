import { Leaf, Target, Eye, Users, Mail, Phone, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Tentang Kami - JagoFarm" };

const values = [
  { icon: Target, title: "Misi Kami", desc: "Menyediakan peralatan pertanian modern berkualitas tinggi yang terjangkau untuk petani dan penghobi Indonesia, mendukung ketahanan pangan nasional melalui teknologi akuaponik, hidroponik, dan smart farming." },
  { icon: Eye, title: "Visi Kami", desc: "Menjadi platform e-commerce pertanian modern terdepan di Indonesia yang memberdayakan setiap individu untuk bercocok tanam secara mandiri, efisien, dan berkelanjutan." },
  { icon: Leaf, title: "Nilai Kami", desc: "Kualitas, inovasi, dan keberlanjutan adalah tiga pilar utama JagoFarm. Kami percaya bahwa pertanian modern adalah kunci masa depan pangan Indonesia." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
          <Leaf className="h-4 w-4" /> Tentang JagoFarm
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Membangun Pertanian Modern Indonesia
        </h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          JagoFarm hadir sejak 2020 sebagai solusi one-stop untuk kebutuhan pertanian modern.
          Dari set tambak, hidroponik, akuaponik, hingga IoT smart farming — kami menyediakan
          produk berkualitas dengan harga terjangkau untuk semua kalangan.
        </p>
      </div>

      {/* Story */}
      <div className="mt-16 grid gap-8 lg:grid-cols-2 items-center">
        <div>
          <h2 className="text-2xl font-bold">Cerita Kami</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Berawal dari sebuah garasi kecil di Surabaya, tim kami yang terdiri dari
            engineer dan pecinta pertanian mulai merakit set hidroponik pertama. Respons
            yang luar biasa dari komunitas mendorong kami untuk terus berinovasi.
          </p>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Kini, JagoFarm telah melayani ribuan pelanggan di seluruh Indonesia dengan
            produk-produk yang dirancang khusus untuk kondisi tropis Indonesia. Kami juga
            menyediakan benih, anakan ikan, dan peralatan IoT untuk smart farming.
          </p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 p-8 flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <Leaf className="h-20 w-20 text-primary/30 mx-auto" />
            <p className="mt-4 text-sm text-muted-foreground">Foto tim & workshop</p>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-center">Nilai-Nilai Kami</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {values.map((v) => (
            <Card key={v.title}>
              <CardContent className="pt-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <v.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-center">Tim Kami</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: "Ahmad Fauzi", role: "Founder & CEO" },
            { name: "Siti Rahma", role: "Head of Operations" },
            { name: "Budi Santoso", role: "Lead Engineer" },
            { name: "Dewi Lestari", role: "Customer Success" },
          ].map((p) => (
            <Card key={p.name}>
              <CardContent className="pt-6 text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-3 font-semibold">{p.name}</h3>
                <p className="text-sm text-muted-foreground">{p.role}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="mt-16 rounded-2xl bg-primary text-primary-foreground p-8 lg:p-12">
        <h2 className="text-2xl font-bold text-center">Hubungi Kami</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3 text-center">
          <div>
            <MapPin className="h-6 w-6 mx-auto mb-2" />
            <p className="text-sm">Jl. Pertanian No. 123, Surabaya, Jawa Timur</p>
          </div>
          <div>
            <Phone className="h-6 w-6 mx-auto mb-2" />
            <p className="text-sm">+62 812-3456-7890</p>
          </div>
          <div>
            <Mail className="h-6 w-6 mx-auto mb-2" />
            <p className="text-sm">hello@jagofarm.id</p>
          </div>
        </div>
      </div>
    </div>
  );
}

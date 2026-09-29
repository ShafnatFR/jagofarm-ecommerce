import { Icon } from "@/components/ui/icon";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Hubungi Kami - JagoFarm" };

export default function ContactPage() {
  return (
    <>
      <section className="relative pt-16 pb-12 bg-gradient-to-b from-white to-[#FAFBFB]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-sm font-semibold mb-6 shadow-sm">
            <Icon name="support_agent" size={16} className="text-emerald-600" />
            <span>Hubungi Kami</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Kami Siap Membantu Anda
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Punya pertanyaan tentang produk atau butuh konsultasi? Tim kami siap membantu.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { icon: "location_on", title: "Alamat", lines: ["Jl. Pertanian No. 123", "Surabaya, Jawa Timur 60111", "Indonesia"] },
            { icon: "call", title: "Telepon", lines: ["+62 812-3456-7890", "Senin-Sabtu: 08:00-17:00 WIB"] },
            { icon: "mail", title: "Email", lines: ["hello@jagofarm.id", "support@jagofarm.id"] },
          ].map((c) => (
            <Card key={c.title} className="border-emerald-100 shadow-sm text-center">
              <CardContent className="pt-8 pb-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 mb-4">
                  <Icon name={c.icon} size={28} className="text-emerald-700" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{c.title}</h3>
                <div className="mt-2 space-y-1">
                  {c.lines.map((l, i) => (
                    <p key={i} className="text-sm text-gray-600">{l}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-primary p-8 text-center text-primary-foreground">
          <h2 className="text-xl font-bold">Chat Langsung via WhatsApp</h2>
          <p className="mt-2 text-primary-foreground/80">Respon cepat dalam jam kerja</p>
          <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-amber-400 transition-colors">
            <Icon name="chat" size={18} /> Chat Sekarang
          </a>
        </div>
      </section>
    </>
  );
}
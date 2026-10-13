import ContactForm from "./contact-form";
import { getStoreProfile, getSiteContent } from "@/lib/site-settings";

export const metadata = { title: "Hubungi Kami - JagoFarm" };

export default async function ContactPage() {
  const [profile, content] = await Promise.all([getStoreProfile(), getSiteContent()]);
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.address)}`;

  return (
    <div>
      {/* HERO SECTION */}
      <div className="relative pt-12 pb-8 sm:pt-16 sm:pb-12 text-center overflow-hidden">
        <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[250px] bg-brand-100/60 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200/80 text-brand-800 text-xs sm:text-sm font-semibold mb-4 shadow-sm">
            <svg className="w-4 h-4 text-brand-700" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Hubungi Kami</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">Kontak</h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto font-normal">
            {content.contactSubtitle}
          </p>
        </div>
      </div>

      {/* kontak details + map */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 flex flex-col gap-6" data-purpose="contact-details-and-map">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-sm divide-y divide-slate-100">
              {/* Alamat */}
              <div className="pb-5 flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0 text-brand-800 shadow-sm mt-0.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">Alamat</h3>
                    <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Kantor Utama</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{profile.address}</p>
                  <a
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900 pt-1"
                    href={mapsSearchUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Lihat rute navigasi
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </a>
                </div>
              </div>

              {/* Telepon */}
              <div className="py-5 flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0 text-brand-800 shadow-sm mt-0.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-900">Telepon</h3>
                  <p className="text-sm font-medium text-slate-700">
                    <a className="hover:text-brand-800 transition" href={`tel:+${profile.whatsapp}`}>{profile.phone}</a>
                  </p>
                  <p className="text-xs text-slate-500">{profile.hours}</p>
                </div>
              </div>

              {/* Email */}
              <div className="py-5 flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0 text-brand-800 shadow-sm mt-0.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-900">Email</h3>
                  <p className="text-sm font-medium text-slate-700">
                    <a className="hover:text-brand-800 transition" href={`mailto:${profile.email}`}>{profile.email}</a>
                  </p>
                  <p className="text-xs text-slate-500">Estimasi balasan: ~2 jam kerja</p>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="pt-5 flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-green-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600 shadow-sm mt-0.5">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.964 9.964 0 001.533 5.337L2 22l4.823-1.504a9.95 9.95 0 005.19 1.487h.004c5.507 0 9.99-4.478 9.99-9.985 0-2.667-1.04-5.174-2.927-7.06A9.929 9.929 0 0012.012 2zm5.82 14.125c-.24.675-1.393 1.29-1.927 1.373-.509.078-1.171.11-1.895-.121a11.954 11.954 0 01-4.707-2.923 11.83 11.83 0 01-2.03-2.528c-.522-.898-.553-1.688-.04-2.222.253-.264.555-.436.745-.436.19 0 .381.002.547.01.177.008.413-.067.645.49.24.577.818 1.996.89 2.143.072.147.12.32.024.513-.096.194-.144.316-.288.486-.144.17-.303.38-.432.51-.144.143-.294.3-.127.585.168.286.746 1.23 1.602 1.991 1.102.98 2.032 1.284 2.32 1.428.288.143.456.12.624-.072.169-.721.84.914-1.127.192-.287.384-.24.648-.143.264.095 1.68.792 1.968.936.288.144.48.216.552.336.072.12.072.696-.168 1.371z" />
                  </svg>
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">WhatsApp</h3>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-800 bg-green-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      {content.contactResponseBadge}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    <a className="hover:text-emerald-600 transition" href={`https://wa.me/${profile.whatsapp}`} rel="noopener noreferrer" target="_blank">{profile.phone}</a>
                  </p>
                  <p className="text-xs text-slate-500">{profile.hours}</p>
                </div>
              </div>
            </div>

            {/* Peta lokasi — iframe embed nyata dari profile.mapsUrl */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm overflow-hidden" id="lokasi-peta">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Peta Lokasi &amp; Gudang</h3>
                </div>
                <span className="text-xs text-slate-400">Bandung, ID</span>
              </div>
              <div className="relative w-full h-56 rounded-xl overflow-hidden border border-slate-200">
                <iframe
                  src={profile.mapsUrl}
                  className="absolute inset-0 w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Peta lokasi JagoFarm"
                />
              </div>
              <div className="flex items-start justify-between mt-3 gap-3">
                <p className="text-xs text-slate-500">{profile.address}</p>
                <a
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 transition duration-150 shrink-0"
                  href={mapsSearchUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span>Buka di Google Maps</span>
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7" data-purpose="contact-form-container">
            <ContactForm />
          </div>
        </div>
      </div>

      {/* FAQ section */}
      <div className="border-t border-slate-200/80 bg-slate-50/60 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-brand-700 uppercase tracking-widest">Bantuan Cepat</span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{content.contactFaqTitle}</h2>
            <p className="text-sm text-slate-500 mt-1">{content.contactFaqSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200/70 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500" />
                {content.contactFaq1Title}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">{content.contactFaq1Body}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200/70 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500" />
                {content.contactFaq2Title}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">{content.contactFaq2Body}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200/70 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500" />
                {content.contactFaq3Title}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">{content.contactFaq3Body}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

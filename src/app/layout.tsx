import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "./providers";
import { SITE_CONFIG } from "@/lib/constants";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["500", "600", "700"],
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

const SITE_DESCRIPTION =
  "JagoFarm menyediakan set tambak, hidroponik, akuaponik, IoT smart farming, benih, dan anakan ikan berkualitas tinggi untuk pertanian modern Indonesia.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "JagoFarm — Solusi Akuaponik & Hidroponik Modern",
    template: "%s | JagoFarm",
  },
  description: SITE_DESCRIPTION,
  applicationName: "JagoFarm",
  keywords: [
    "akuaponik",
    "hidroponik",
    "tambak",
    "smart farming",
    "IoT pertanian",
    "benih ikan",
    "aquaponics Indonesia",
  ],
  // CATATAN: JANGAN set `alternates.canonical` di root — metadata diwariskan ke
  // SEMUA halaman, sehingga tiap halaman produk/kebijakan akan memancarkan
  // canonical "/" dan berisiko tidak terindeks. Set canonical per-halaman.
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "JagoFarm",
    url: SITE_URL,
    title: "JagoFarm — Solusi Akuaponik & Hidroponik Modern",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "JagoFarm",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JagoFarm — Solusi Akuaponik & Hidroponik Modern",
    description: SITE_DESCRIPTION,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#061710",
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${cormorant.variable} ${manrope.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Anti-kedip mode gelap (A15): terapkan tema sebelum paint pertama. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- font ikon Material Symbols dimuat sekali di root layout (App Router), bukan per-halaman */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="bg-background text-on-surface selection:bg-secondary-fixed-dim selection:text-primary min-h-full flex flex-col">
        {/* JSON-LD Organization — identitas toko untuk mesin pencari. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: SITE_CONFIG.name,
              url: SITE_CONFIG.url,
              email: SITE_CONFIG.email,
              telephone: `+${SITE_CONFIG.whatsappIntl}`,
              address: SITE_CONFIG.address,
              sameAs: [SITE_CONFIG.social.instagram, SITE_CONFIG.social.linkedin].filter(Boolean),
            }),
          }}
        />
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
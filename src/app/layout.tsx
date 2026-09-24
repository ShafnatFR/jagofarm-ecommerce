import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
  alternates: {
    canonical: "/",
  },
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
        url: "/favicon.ico",
        width: 256,
        height: 256,
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
  themeColor: "#1B4D3E",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

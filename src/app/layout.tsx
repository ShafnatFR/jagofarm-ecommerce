import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "JagoFarm — Solusi Akuaponik & Hidroponik Modern",
    template: "%s | JagoFarm",
  },
  description:
    "JagoFarm menyediakan set tambak, hidroponik, akuaponik, IoT smart farming, benih, dan anakan ikan berkualitas tinggi untuk pertanian modern Indonesia.",
  keywords: [
    "akuaponik",
    "hidroponik",
    "tambak",
    "smart farming",
    "IoT pertanian",
    "benih ikan",
    "aquaponics Indonesia",
  ],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "JagoFarm",
  },
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

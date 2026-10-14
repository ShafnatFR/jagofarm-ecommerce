import type { NextConfig } from "next";

/**
 * Header keamanan (diterapkan ke semua rute).
 *
 * Sengaja TIDAK memakai Content-Security-Policy yang ketat dulu: situs ini
 * memuat font Google + Material Symbols, iframe Google Maps (form alamat),
 * Cloudinary, Supabase, dan inline script (JSON-LD, tema). CSP yang salah
 * akan merusak fitur. Header di bawah ini aman (tidak mengganggu fungsi)
 * tapi menutup kelas serangan umum: sniffing, clickjacking, leak referrer,
 * dan downgrade HTTPS.
 */
const securityHeaders = [
  // Cegah MIME-sniffing (data teks dikira eksekutable).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Cegah clickjacking (jangan biarkan situs lain bungkus halaman kita).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Kirim origin saja, bukan URL penuh, ke situs lain.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Paksa HTTPS selama 2 tahun (termasuk subdomain).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  // Izinkan hanya fitur yang dipakai: geolocation dipakai form alamat.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=()",
  },
];

const nextConfig: NextConfig = {
  // Sembunyikan "X-Powered-By: Next.js" (jangan bocorkan framework).
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  turbopack: {},
};

export default nextConfig;

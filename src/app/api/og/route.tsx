import { ImageResponse } from "next/og";
import { SITE_CONFIG } from "@/lib/constants";

/**
 * Runtime Node.js (bukan edge): bundel ImageResponse + font melebihi batas
 * 1 MB untuk Edge Function di plan Vercel saat ini (error: "Edge Function
 * api/og size is 1.06 MB and your plan size limit is 1 MB"). Runtime Node.js
 * tidak terkena batas ukuran edge tersebut, fungsionalitas OG image tetap sama.
 */
export const runtime = "nodejs";

/**
 * Preview dinamis untuk WhatsApp/social (OG image 1200x630).
 * Dipakai lewat query: /api/og?title=Judul&subtitle=Sub
 * Tanpa parameter, menghasilkan kartu brand default.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") ?? SITE_CONFIG.name).slice(0, 80);
  const subtitle = (searchParams.get("subtitle") ?? SITE_CONFIG.tagline).slice(0, 80);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #14532d 0%, #166534 55%, #15803d 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#bbf7d0",
              color: "#14532d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            JF
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, opacity: 0.9 }}>{SITE_CONFIG.name}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: title.length > 45 ? 56 : 72,
              fontWeight: 800,
              lineHeight: 1.1,
              maxWidth: 1050,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 36, color: "#bbf7d0", fontWeight: 600 }}>{subtitle}</div>
        </div>

        <div style={{ display: "flex", fontSize: 26, opacity: 0.75 }}>
          {SITE_CONFIG.url.replace(/^https?:\/\//, "")}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/constants";

const SITE_URL = (
  siteUrl()
).replace(/\/$/, "");
const IS_PRODUCTION = process.env.NODE_ENV === "production";

export default function robots(): MetadataRoute.Robots {
  // Saat bukan produksi, jangan indeks apa pun.
  if (!IS_PRODUCTION) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Area privat & internal tidak perlu diindeks.
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/account",
          "/account/",
          "/cart",
          "/checkout",
          "/orders",
          "/orders/",
          "/wishlist",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

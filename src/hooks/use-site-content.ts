"use client";

import { useState, useEffect } from "react";
import {
  SITE_CONTENT_DEFAULT,
  type SiteContent,
} from "@/lib/site-settings-shared";

let cachedContent: SiteContent | null = null;
let fetchPromise: Promise<SiteContent> | null = null;

async function fetchSiteContentFromAPI(): Promise<SiteContent> {
  if (cachedContent) return cachedContent;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const res = await fetch("/api/site-content", {
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return SITE_CONTENT_DEFAULT;
      const data = (await res.json()) as { content?: Partial<SiteContent> };
      const merged = { ...SITE_CONTENT_DEFAULT, ...(data.content ?? {}) };
      cachedContent = merged;
      return merged;
    } catch {
      return SITE_CONTENT_DEFAULT;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

/**
 * Teks konten situs untuk komponen klien (navbar, halaman masuk/daftar).
 * Selalu mengembalikan objek valid: default dipakai selama fetch berjalan
 * atau bila API gagal, sehingga tidak pernah ada teks kosong di layar.
 */
export function useSiteContent() {
  const [content, setContent] = useState<SiteContent>(
    cachedContent ?? SITE_CONTENT_DEFAULT
  );

  useEffect(() => {
    let active = true;
    fetchSiteContentFromAPI().then((value) => {
      if (active) setContent(value);
    });
    return () => {
      active = false;
    };
  }, []);

  return content;
}

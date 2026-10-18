"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Menyegarkan data server-component secara berkala.
 *
 * Halaman /admin/consultation adalah server component: tiket baru yang dibuat
 * pelanggan tidak akan terlihat sampai ada yang me-render ulang. Komponen ini
 * memanggil `router.refresh()` tiap `intervalMs` supaya tiket masuk sendiri
 * tanpa admin menekan "Muat ulang".
 *
 * `router.refresh()` tidak menghapus state client (draft balasan tetap aman),
 * dan tidak berjalan saat tab tidak terlihat agar tidak membebani server.
 */
export function AutoRefresh({
  intervalMs = 20000,
  enabled = true,
}: {
  intervalMs?: number;
  enabled?: boolean;
}) {
  const router = useRouter();
  const refreshingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      // Lewati saat tab disembunyikan atau refresh sebelumnya belum selesai.
      if (document.visibilityState !== "visible" || refreshingRef.current) return;
      refreshingRef.current = true;
      router.refresh();
      // Beri jeda singkat sebelum boleh refresh lagi.
      setTimeout(() => {
        refreshingRef.current = false;
      }, 3000);
    };

    const interval = setInterval(tick, intervalMs);
    return () => clearInterval(interval);
  }, [router, intervalMs, enabled]);

  return null;
}

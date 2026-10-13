"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/icon";

type Theme = "light" | "dark";

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

/**
 * Tombol pengalih mode terang/gelap (A15).
 * Status dibaca langsung dari kelas `.dark` di <html> via useSyncExternalStore
 * (tidak ada setState di dalam effect). Preferensi disimpan di localStorage;
 * script anti-kedip ada di layout dan dijalankan sebelum paint.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    root.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* localStorage bisa diblokir; abaikan */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      title={theme === "dark" ? "Mode terang" : "Mode gelap"}
      className={`rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low ${className}`}
    >
      <Icon name={theme === "dark" ? "light_mode" : "dark_mode"} size={20} />
    </button>
  );
}

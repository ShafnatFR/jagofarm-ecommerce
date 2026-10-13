"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";

type Theme = "light" | "dark";

/**
 * Tombol pengalih mode terang/gelap (A15).
 * Preferensi disimpan di localStorage; kelas `.dark` dipasang di <html>.
 * Script anti-kedip ada di layout (dijalankan sebelum paint).
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    const root = document.documentElement;
    root.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* localStorage bisa diblokir; abaikan */
    }
  }

  // Hindari hydration mismatch: render ikon netral sampai mounted.
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      title={theme === "dark" ? "Mode terang" : "Mode gelap"}
      className={`rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low ${className}`}
    >
      <Icon name={mounted && theme === "dark" ? "light_mode" : "dark_mode"} size={20} />
    </button>
  );
}

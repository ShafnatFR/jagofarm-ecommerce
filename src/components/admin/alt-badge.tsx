"use client";

import { cn } from "@/lib/utils";

/** Badge kecil kuning ala hint Vimium: muncul saat Alt ditahan. */
export function AltBadge({
  combo,
  visible,
  className,
}: {
  combo: string;
  visible: boolean;
  className?: string;
}) {
  if (!visible) return null;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none inline-flex items-center rounded border border-amber-300 bg-amber-100 px-1 py-px",
        "text-[10px] font-bold leading-none text-amber-900 shadow-sm dark:border-amber-500/50 dark:bg-amber-500/20 dark:text-amber-200",
        className
      )}
    >
      {combo}
    </span>
  );
}

"use client";

/**
 * State error siap-pakai untuk halaman admin (state "Gagal memuat ...").
 *
 * Perilaku dinamis per skenario:
 * - 401 (sesi admin berakhir)  → tombol "Login Admin" tersedia.
 * - error lain                 → tombol "Coba lagi" opsional dari caller.
 *
 * `status` boleh ditebak dari teks error bila halaman hanya punya `Error`
 * (pola lama `throw new Error(\`HTTP ${status}\`)`) — diparse bila ada.
 */
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { describeHttpStatus } from "@/lib/api-errors";

interface AdminErrorStateProps {
  message: string;
  onRetry?: () => void;
}

/** Ekstrak kode HTTP dari pesan error bentuk lama, mis. "HTTP 403". */
function statusFromMessage(message: string): number | null {
  const m = message.match(/HTTP (\d{3})/);
  return m ? Number(m[1]) : null;
}

/** Pesan yang user pahami: tinggalkan mesin ("HTTP 401"), beri konteks. */
export function humanizeError(message: string): string {
  const status = statusFromMessage(message);
  if (!status) return message;
  return describeHttpStatus(status) || `Permintaan gagal (HTTP ${status})`;
}

function statusOf(message: string): number | null {
  return statusFromMessage(message);
}

export function AdminErrorState({ message, onRetry }: AdminErrorStateProps) {
  const status = statusOf(message);
  const isAuthIssue = status === 401 || status === 403;
  const text = humanizeError(message);

  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <Icon name="info" size={40} className="mx-auto text-destructive/80" />
        <p className="mt-2 text-sm text-on-surface-variant">Gagal memuat: {text}</p>
        {status === 401 && (
          <Link
            href="/login?callbackUrl=%2Fadmin"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary"
          >
            <Icon name="login" size={16} />
            Login Admin
          </Link>
        )}
        {!isAuthIssue && onRetry && (
          <button onClick={onRetry} className="mt-2 block w-full text-sm text-primary underline">
            Coba lagi
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { formatPrice } from "@/lib/utils";

interface PointRow {
  id: string;
  amount: number;
  balance: number;
  type: string;
  note: string | null;
  createdAt: string;
}

interface PointsData {
  points: number;
  referralCode: string | null;
  /** Rupiah per 1 poin (dari server, env LOYALTY_EARN_PER_AMOUNT). */
  earnPerAmount?: number;
  history: PointRow[];
}

interface ReferralData {
  code: string | null;
  stats: { total: number; rewarded: number; pending: number };
}

const TYPE_LABEL: Record<string, string> = {
  earn: "Belanja",
  redeem: "Penukaran",
  adjust: "Penyesuaian",
  referral: "Referral",
  refund: "Pengembalian",
};

function formatNumber(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n);
}

function formatDate(iso: string): string {
  // Catatan: new Date(tak-valid) TIDAK melempar — ia membentuk Invalid Date dan
  // toLocaleDateString mengembalikan "Invalid Date" tanpa error, sehingga
  // try/catch lama tak pernah aktif. Guard eksplisit diperlukan.
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PointsPage() {
  const [points, setPoints] = useState<PointsData | null>(null);
  const [referral, setReferral] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [pRes, rRes] = await Promise.all([
          fetch("/api/user/points", { cache: "no-store" }),
          fetch("/api/user/referral", { cache: "no-store" }),
        ]);
        if (!pRes.ok) throw new Error("Gagal memuat poin.");
        const pData = (await pRes.json()) as PointsData;
        const rData = rRes.ok ? ((await rRes.json()) as ReferralData) : null;
        if (active) {
          setPoints(pData);
          setReferral(rData);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  async function copyCode() {
    const code = referral?.code ?? points?.referralCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard bisa diblokir; abaikan */
    }
  }

  const code = referral?.code ?? points?.referralCode ?? null;
  const stats = referral?.stats;

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">Memuat poin…</div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <Icon name="error" size={32} className="mx-auto text-red-500" />
        <p className="mt-2 text-sm text-slate-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface">Poin &amp; Referral</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Kumpulkan poin dari setiap belanja dan ajak teman untuk dapat bonus.
        </p>
      </header>

      {/* Kartu saldo poin */}
      <section className="rounded-2xl border border-outline-variant bg-surface p-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Saldo Poin
            </p>
            <p className="mt-1 font-serif text-3xl sm:text-4xl font-extrabold text-primary dark:text-tertiary">
              {formatNumber(points?.points ?? 0)}
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">
              1 poin per {formatPrice(points?.earnPerAmount ?? 10_000)} belanja.
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:text-tertiary border border-outline-variant">
            <Icon name="stars" size={28} />
          </div>
        </div>
      </section>

      {/* Kartu referral */}
      <section className="rounded-2xl border border-outline-variant bg-surface p-6 shadow-md">
        <h2 className="font-serif text-xl font-bold text-on-surface">Kode Referral Anda</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Bagikan kode ini. Teman yang mendaftar dengan kode Anda akan tercatat.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <code className="rounded-xl border border-dashed border-primary/40 bg-surface-container px-4 py-2 text-lg font-bold tracking-wider text-primary dark:text-tertiary">
            {code ?? "—"}
          </code>
          <button
            type="button"
            onClick={copyCode}
            disabled={!code}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:brightness-110 disabled:opacity-50 shadow-sm"
          >
            <Icon name={copied ? "check" : "content_copy"} size={16} />
            {copied ? "Tersalin" : "Salin kode"}
          </button>
        </div>

        {stats && (
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-surface-container-low border border-outline-variant p-3 text-center">
              <p className="font-serif text-xl font-bold text-on-surface">{stats.total}</p>
              <p className="text-xs text-on-surface-variant">Total diundang</p>
            </div>
            <div className="rounded-xl bg-surface-container-low border border-outline-variant p-3 text-center">
              <p className="font-serif text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.rewarded}</p>
              <p className="text-xs text-on-surface-variant">Berhasil</p>
            </div>
            <div className="rounded-xl bg-surface-container-low border border-outline-variant p-3 text-center">
              <p className="font-serif text-xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
              <p className="text-xs text-on-surface-variant">Menunggu</p>
            </div>
          </div>
        )}
      </section>

      {/* Riwayat poin */}
      <section className="rounded-2xl border border-outline-variant bg-surface shadow-md overflow-hidden">
        <div className="border-b border-outline-variant px-6 py-4">
          <h2 className="font-serif text-xl font-bold text-on-surface">Riwayat Poin</h2>
        </div>
        {points && points.history.length > 0 ? (
          <ul className="divide-y divide-outline-variant">
            {points.history.map((row) => (
              <li key={row.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-surface-container-low/50 transition-colors">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-on-surface">
                    {TYPE_LABEL[row.type] ?? row.type}
                  </p>
                  <p className="truncate text-xs text-on-surface-variant">
                    {row.note ?? "—"} • {formatDate(row.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-serif text-base font-bold ${
                      row.amount >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-error"
                    }`}
                  >
                    {row.amount >= 0 ? "+" : ""}
                    {formatNumber(row.amount)}
                  </p>
                  <p className="text-xs text-on-surface-variant">Saldo {formatNumber(row.balance)}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-6 py-10 text-center text-sm text-on-surface-variant">
            Belum ada riwayat poin. Mulai belanja untuk mengumpulkan poin.
          </p>
        )}
      </section>

      <div className="text-center">
        <Link href="/products" className="text-sm font-semibold text-primary dark:text-tertiary hover:underline">
          Mulai belanja →
        </Link>
      </div>
    </div>
  );
}

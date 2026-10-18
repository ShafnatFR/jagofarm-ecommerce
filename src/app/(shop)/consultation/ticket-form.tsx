"use client";

import { useState, FormEvent } from "react";
import { TEAM } from "@/lib/constants";

export interface CreatedTicket {
  sessionId: string;
  sessionRef: string | null;
  status: string;
  accessToken: string | null;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const EMPTY: FormState = { name: "", email: "", phone: "", subject: "", message: "" };

/**
 * Form pembuka tiket konsultasi untuk pengunjung tanpa akun.
 *
 * Mengirim ke POST /api/consultation/ticket. Server membalas dengan
 * accessToken yang HANYA dikembalikan sekali — token itu disimpan oleh
 * parent (ConsultationChat) dan menjadi bukti kepemilikan tiket.
 */
export function TicketForm({
  onCreated,
  defaultName = "",
  defaultEmail = "",
}: {
  onCreated: (ticket: CreatedTicket) => void;
  defaultName?: string;
  defaultEmail?: string;
}) {
  const [form, setForm] = useState<FormState>({
    ...EMPTY,
    name: defaultName,
    email: defaultEmail,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const update = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (form.name.trim().length < 2) next.name = "Nama minimal 2 karakter";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = "Email tidak valid";
    if (form.message.trim().length < 10)
      next.message = "Ceritakan kebutuhan Anda minimal 10 karakter";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate() || submitting) return;

    setSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch("/api/consultation/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          subject: form.subject.trim() || undefined,
          message: form.message.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const fieldErrors = Array.isArray(data?.errors) ? data.errors : [];
        if (fieldErrors.length > 0) {
          setErrors(
            Object.fromEntries(
              fieldErrors.map((item: { field?: string; message?: string }) => [
                item.field ?? "message",
                item.message ?? "Tidak valid",
              ])
            )
          );
        }
        throw new Error(
          typeof data?.error === "string" ? data.error : "Gagal membuka tiket"
        );
      }

      onCreated({
        sessionId: data.sessionId,
        sessionRef: data.sessionRef ?? null,
        status: data.status ?? "active",
        accessToken: data.accessToken ?? null,
      });
      setForm(EMPTY);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Gagal membuka tiket");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field: keyof FormState) =>
    `w-full rounded-xl border px-3.5 py-2.5 text-sm bg-surface text-on-surface outline-none transition focus:ring-1 ${
      errors[field]
        ? "border-error focus:border-error focus:ring-error"
        : "border-outline-variant focus:border-primary focus:ring-primary"
    }`;

  return (
    <div className="flex h-full flex-col overflow-y-auto custom-scrollbar">
      <div className="px-5 py-4 border-b border-outline-variant bg-surface-container-low/60">
        <h2 className="font-serif text-lg font-bold text-on-surface">
          Buka Tiket Konsultasi
        </h2>
        <p className="mt-1 text-xs text-on-surface-variant">
          Isi data di bawah — tiket langsung masuk ke tim {TEAM.LABEL}. Tidak perlu
          punya akun.
        </p>
      </div>

      <form onSubmit={submit} className="flex-1 space-y-3.5 p-5">
        {serverError && (
          <div className="rounded-xl border border-error/30 bg-error-container/20 p-3 text-xs text-error">
            {serverError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label htmlFor="ticket-name" className="mb-1.5 block text-xs font-semibold text-on-surface">
              Nama <span className="text-error">*</span>
            </label>
            <input
              id="ticket-name"
              className={inputClass("name")}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Nama Anda"
              autoComplete="name"
              required
            />
            {errors.name && <p className="mt-1 text-[11px] text-error">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="ticket-email" className="mb-1.5 block text-xs font-semibold text-on-surface">
              Email <span className="text-error">*</span>
            </label>
            <input
              id="ticket-email"
              type="email"
              className={inputClass("email")}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="email@anda.com"
              autoComplete="email"
              required
            />
            {errors.email && <p className="mt-1 text-[11px] text-error">{errors.email}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label htmlFor="ticket-phone" className="mb-1.5 block text-xs font-semibold text-on-surface">
              WhatsApp <span className="text-on-surface-variant font-normal">(opsional)</span>
            </label>
            <input
              id="ticket-phone"
              className={inputClass("phone")}
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="08xxxxxxxxxx"
              autoComplete="tel"
              inputMode="tel"
            />
          </div>

          <div>
            <label htmlFor="ticket-subject" className="mb-1.5 block text-xs font-semibold text-on-surface">
              Topik <span className="text-on-surface-variant font-normal">(opsional)</span>
            </label>
            <input
              id="ticket-subject"
              className={inputClass("subject")}
              value={form.subject}
              onChange={(e) => update("subject", e.target.value)}
              placeholder="mis. Bioflok vaname 1000 ekor"
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="ticket-message" className="block text-xs font-semibold text-on-surface">
              Kebutuhan Anda <span className="text-error">*</span>
            </label>
            <span className="text-[11px] text-on-surface-variant">
              {form.message.trim().length}/5000
            </span>
          </div>
          <textarea
            id="ticket-message"
            className={`${inputClass("message")} min-h-[120px] resize-y`}
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
            placeholder="Ceritakan kondisi lahan/kolam, ukuran, atau kendala yang Anda hadapi…"
            maxLength={5000}
            required
          />
          {errors.message && (
            <p className="mt-1 text-[11px] text-error">{errors.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-on-surface-variant">
            Data Anda hanya dipakai untuk konsultasi ini.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary shadow-sm transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base" data-icon="send">
              send
            </span>
            {submitting ? "Membuka tiket…" : "Buka Tiket"}
          </button>
        </div>
      </form>
    </div>
  );
}

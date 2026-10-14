"use client";

import { useState, FormEvent } from "react";

type Topic = "pemesanan" | "teknis" | "iot" | "kemitraan";

interface FormData {
  name: string;
  email: string;
  topic: Topic;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  topic?: string;
  subject?: string;
  message?: string;
}

export default function ContactForm() {
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    topic: "pemesanan",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (form.name.trim().length < 2) newErrors.name = "Nama harus minimal 2 karakter";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Email tidak valid";
    if (form.subject.trim().length < 3) newErrors.subject = "Subjek harus minimal 3 karakter";
    if (form.message.trim().length < 20) newErrors.message = "Pesan harus minimal 20 karakter";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // API bisa membalas { error: string } atau { errors: [{field,message}] }.
        const errs = Array.isArray(data?.errors) ? data.errors : [];
        const msg =
          errs.length > 0
            ? errs.map((e: { message?: string }) => e?.message).filter(Boolean).join(", ")
            : typeof data?.error === "string"
              ? data.error
              : "Gagal mengirim pesan";
        throw new Error(msg);
      }

      setStatus("success");
      setForm({ name: "", email: "", topic: "pemesanan", subject: "", message: "" });
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.");
    }
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-10 shadow-sm relative">
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Kirim Pesan</h2>
        <p className="text-sm text-slate-600 mt-1">
          Silakan isi formulir di bawah ini, tim spesialis agrikultur kami akan merespon dalam waktu 1x24 jam.
        </p>
      </div>

      {status === "success" && (
        <div className="mb-6 rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-800 font-medium flex items-start gap-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Pesan Anda terkirim. Terima kasih! Tim kami akan merespons dalam 1x24 jam.
        </div>
      )}

      {status === "error" && errorMessage && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 font-medium flex items-start gap-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {errorMessage}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Nama <span className="text-red-500">*</span>
            </label>
            <input
              className={`w-full rounded-xl border px-4 py-3 text-sm bg-slate-50/50 focus:bg-white transition outline-none ${
                errors.name ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200" : "border-slate-200 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20"
              }`}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Nama Anda"
              required
              type="text"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              className={`w-full rounded-xl border px-4 py-3 text-sm bg-slate-50/50 focus:bg-white transition outline-none ${
                errors.email ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200" : "border-slate-200 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20"
              }`}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="email@anda.com"
              required
              type="email"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Kategori Konsultasi
          </label>
          <div className="flex flex-wrap gap-2">
            {(["pemesanan", "teknis", "iot", "kemitraan"] as Topic[]).map((topic) => (
              <label key={topic} className="inline-flex items-center text-xs font-medium cursor-pointer">
                <input
                  className="peer sr-only"
                  name="topic"
                  type="radio"
                  value={topic}
                  checked={form.topic === topic}
                  onChange={(e) => update("topic", e.target.value)}
                  required
                />
                <span className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 peer-checked:bg-brand-800 peer-checked:text-white peer-checked:border-brand-800 transition capitalize">
                  {topic === "pemesanan" ? "Pemesanan Produk" : topic === "teknis" ? "Konsultasi Hidroponik/Tambak" : topic === "iot" ? "Smart Farming IoT" : "Kemitraan"}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Subjek <span className="text-red-500">*</span>
          </label>
          <input
            className={`w-full rounded-xl border px-4 py-3 text-sm bg-slate-50/50 focus:bg-white transition outline-none ${
              errors.subject ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200" : "border-slate-200 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20"
            }`}
            value={form.subject}
            onChange={(e) => update("subject", e.target.value)}
            placeholder="Perihal pesan Anda"
            required
            type="text"
          />
          {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Pesan <span className="text-red-500">*</span>
            </label>
            <span className="text-xs text-slate-400">Minimal 20 karakter</span>
          </div>
          <textarea
            className={`w-full rounded-xl border px-4 py-3 text-sm bg-slate-50/50 focus:bg-white transition outline-none resize-y ${
              errors.message ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200" : "border-slate-200 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20"
            }`}
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
            placeholder="Tuliskan pesan Anda di sini..."
            required
            rows={5}
          />
          {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={status === "submitting"}
            className="inline-flex items-center justify-center gap-2.5 bg-brand-800 hover:bg-brand-900 active:bg-brand-950 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold text-sm px-7 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-700 focus:ring-offset-2"
          >
            {status === "submitting" ? (
              <>
                <svg className="w-4 h-4 text-brand-200 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Mengirim...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-brand-200" fill="none" stroke="currentColor" strokeWidth="2.3" viewBox="0 0 24 24">
                  <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Kirim Pesan
              </>
            )}
          </button>
          <span className="text-xs text-slate-400 block sm:inline-block sm:ml-4 mt-2 sm:mt-0">
            Data Anda dijaga kerahasiaannya sesuai kebijakan privasi kami.
          </span>
        </div>
      </form>
    </div>
  );
}

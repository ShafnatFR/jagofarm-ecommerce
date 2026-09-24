"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Droplets, Leaf, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface HeroSlide {
  id: string;
  eyebrow: string;
  title: string;
  /** Kata beraksen di dalam judul. Opsional. */
  highlight?: string;
  subtitle: string;
  cta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  /** Utility class Tailwind untuk latar (gradasi hijau tua, tanpa gambar eksternal). */
  gradient: string;
  Icon: React.ComponentType<{ className?: string }>;
}

/** Interval autoplay (ms). */
const AUTOPLAY_MS = 6000;
/** Ambang geser (px) supaya swipe dianggap sah. */
const SWIPE_THRESHOLD = 50;

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: "set-tambak",
    eyebrow: "Set Tambak Siap Pakai",
    title: "Budi Daya Tambak",
    highlight: "Lebih Terukur",
    subtitle:
      "Set tambak lengkap — dari pompa, aerator, hingga peralatan kualitas air — untuk hasil panen yang lebih stabil sepanjang musim.",
    cta: { label: "Lihat Set Tambak", href: "/products?category=set-tambak" },
    secondaryCta: { label: "Konsultasi Gratis", href: "/contact" },
    gradient: "bg-gradient-to-br from-[#0F2E22] via-[#1B4D3E] to-[#2C6E52]",
    Icon: Droplets,
  },
  {
    id: "set-hidroponik",
    eyebrow: "Set Hidroponik Pemula",
    title: "Mulai Hidroponik",
    highlight: "dari Nol",
    subtitle:
      "Paket hidroponik siap instal: instalasi, nutrisi, netpot, dan benih. Cukup rakit di rumah, panen sayur segar dalam hitungan minggu.",
    cta: { label: "Lihat Set Hidroponik", href: "/products?category=set-hidroponik" },
    secondaryCta: { label: "Panduan Pemula", href: "/how-to-order" },
    gradient: "bg-gradient-to-br from-[#123326] via-[#1B4D3E] to-[#3E7C5A]",
    Icon: Sprout,
  },
  {
    id: "konsultasi",
    eyebrow: "Layanan Konsultasi",
    title: "Rancang Sistem Pertanian",
    highlight: "Bersama Ahli",
    subtitle:
      "Tim ahli JagoFarm membantu memilih set, menghitung kapasitas, dan menyusun rencana budidaya sesuai lahan serta budget Anda.",
    cta: { label: "Mulai Konsultasi", href: "/contact" },
    secondaryCta: { label: "Lihat Semua Produk", href: "/products" },
    gradient: "bg-gradient-to-br from-[#1B4D3E] via-[#245E4B] to-[#0F2E22]",
    Icon: Leaf,
  },
];

interface HeroCarouselProps {
  /** Override konten slide. Default memakai DEFAULT_HERO_SLIDES. */
  slides?: HeroSlide[];
  /** Interval autoplay dalam ms. */
  intervalMs?: number;
}

export function HeroCarousel({
  slides = DEFAULT_HERO_SLIDES,
  intervalMs = AUTOPLAY_MS,
}: HeroCarouselProps) {
  const total = slides.length;
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  /** Autoplay berhenti saat hover/focus/swipe (interacting) atau tab tidak aktif. */
  const [interacting, setInteracting] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback(
    (next: number, dir: number) => {
      if (total === 0) return;
      setDirection(dir);
      setIndex(((next % total) + total) % total);
    },
    [total]
  );

  const next = useCallback(() => goTo(index + 1, 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1, -1), [goTo, index]);

  // Autoplay — berhenti saat hover/focus, saat tab tidak terlihat, dan saat
  // pengguna meminta animasi minimal.
  useEffect(() => {
    if (total <= 1 || interacting || pageHidden || reduceMotion) return;
    const timer = setInterval(() => {
      setDirection(1);
      setIndex((current) => (current + 1) % total);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [total, interacting, pageHidden, reduceMotion, intervalMs]);

  // Jangan lanjut berganti slide saat tab di latar belakang.
  useEffect(() => {
    const onVisibilityChange = () => setPageHidden(document.hidden);
    onVisibilityChange();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      prev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    setInteracting(true);
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    const startX = touchStartX.current;
    touchStartX.current = null;
    setInteracting(false);
    if (startX === null) return;
    const delta = (event.changedTouches[0]?.clientX ?? startX) - startX;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    if (delta < 0) next();
    else prev();
  };

  const handleBlur = (event: React.FocusEvent<HTMLElement>) => {
    const nextFocused = event.relatedTarget as Node | null;
    if (!nextFocused || !event.currentTarget.contains(nextFocused)) {
      setInteracting(false);
    }
  };

  const variants: Variants = {
    enter: (dir: number) => ({
      opacity: 0,
      x: reduceMotion ? 0 : dir > 0 ? 48 : -48,
    }),
    center: {
      opacity: 1,
      x: 0,
      transition: { duration: reduceMotion ? 0 : 0.5, ease: "easeOut" },
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: reduceMotion ? 0 : dir > 0 ? -48 : 48,
      transition: { duration: reduceMotion ? 0 : 0.35, ease: "easeIn" },
    }),
  };

  if (total === 0) return null;

  const slide = slides[index];
  const { Icon } = slide;

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Promo JagoFarm"
      tabIndex={0}
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocus={() => setInteracting(true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative isolate overflow-hidden bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
    >
      <AnimatePresence initial={false} mode="wait" custom={direction}>
        <motion.div
          key={slide.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          aria-roledescription="slide"
          aria-label={`Slide ${index + 1} dari ${total}`}
          className={cn("relative text-primary-foreground", slide.gradient)}
        >
          {/* Ornamen latar (tanpa gambar eksternal) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-accent/10 blur-3xl"
          />

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-24">
            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-1.5 text-sm font-medium text-accent">
                  <Icon className="h-4 w-4" />
                  {slide.eyebrow}
                </span>
                <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                  {slide.title}
                  {slide.highlight && (
                    <>
                      {" "}
                      <span className="text-accent">{slide.highlight}</span>
                    </>
                  )}
                </h1>
                <p className="mt-4 max-w-lg text-lg leading-relaxed text-primary-foreground/80">
                  {slide.subtitle}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href={slide.cta.href}>
                    <Button size="lg" variant="accent">
                      {slide.cta.label}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  {slide.secondaryCta && (
                    <Link href={slide.secondaryCta.href}>
                      <Button
                        size="lg"
                        variant="secondary"
                        className="border-white/30 text-white hover:bg-white/10"
                      >
                        {slide.secondaryCta.label}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="relative flex h-80 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <Icon className="h-24 w-24 text-white/20" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Slide sebelumnya"
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/20 p-2 text-white transition-colors hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Slide berikutnya"
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/20 p-2 text-white transition-colors hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
            {slides.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(i, i > index ? 1 : -1)}
                aria-label={`Tampilkan slide ${i + 1}: ${item.eyebrow}`}
                aria-current={i === index ? "true" : undefined}
                className={cn(
                  "h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  i === index ? "w-6 bg-accent" : "w-2 bg-white/40 hover:bg-white/70"
                )}
              />
            ))}
          </div>
        </>
      )}

      {/* Pengumuman slide aktif untuk pembaca layar */}
      <span className="sr-only" aria-live="polite">
        {`Slide ${index + 1} dari ${total}: ${slide.eyebrow}`}
      </span>
    </section>
  );
}

export default HeroCarousel;

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { siteUrl } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverUrl: string | null;
  createdAt: string;
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const base = siteUrl();
    const res = await fetch(`${base}/api/blog?slug=${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.article ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  return {
    title: { absolute: article ? `${article.title} — JagoFarm` : "Artikel — JagoFarm" },
    description: article?.excerpt ?? "Artikel JagoFarm.",
    alternates: { canonical: `/blog/${slug}` },
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">← Semua artikel</Link>
      <h1 className="mt-4 text-3xl font-bold">{article.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {new Date(article.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
      </p>
      <div className="mt-6 space-y-4 text-[15px] leading-relaxed">
        {article.content.split("\n").map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </div>
  );
}

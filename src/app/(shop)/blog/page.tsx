import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Blog — JagoFarm" },
  description: "Artikel pertanian, akuakultur, dan IoT smart farming dari JagoFarm.",
  alternates: { canonical: "/blog" },
};

export const dynamic = "force-dynamic";

interface BlogItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverUrl: string | null;
  createdAt: string;
}

async function getArticles(): Promise<BlogItem[]> {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/blog`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.articles ?? [];
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const articles = await getArticles();
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">Blog</h1>
      <p className="mt-2 text-muted-foreground">Panduan budidaya, akuakultur, dan smart farming.</p>
      {articles.length === 0 ? (
        <p className="mt-8 text-muted-foreground">Belum ada artikel.</p>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {articles.map((a) => (
            <Link key={a.id} href={`/blog/${a.slug}`} className="rounded-2xl border border-outline-variant p-6 hover:border-primary/50 transition-colors">
              <h2 className="text-lg font-bold">{a.title}</h2>
              {a.excerpt && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{a.excerpt}</p>}
              <p className="mt-3 text-xs text-muted-foreground">
                {new Date(a.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

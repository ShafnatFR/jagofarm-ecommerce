import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Halaman /search adalah alias ramah-URL untuk /products?search=...
 * Semua filter diteruskan apa adanya supaya link lama tidak 404.
 * Mendukung juga param lama ?q= / ?query= yang dipetakan ke `search`.
 */
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolved = (await searchParams) ?? {};

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(resolved)) {
    if (typeof value === "string") {
      params.set(key, value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") params.append(key, item);
      }
    }
  }

  if (!params.get("search")) {
    const legacy = params.get("q") ?? params.get("query") ?? "";
    params.delete("q");
    params.delete("query");
    if (legacy.trim()) params.set("search", legacy.trim());
  }

  const qs = params.toString();
  redirect(qs ? `/products?${qs}` : "/products");
}

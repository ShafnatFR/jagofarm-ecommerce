"use client";

import { useState, useEffect } from "react";

export interface NavCategory {
  id: string;
  name: string;
  slug: string;
}

let cachedCategories: NavCategory[] | null = null;
let fetchPromise: Promise<NavCategory[]> | null = null;

async function fetchCategoriesFromAPI(): Promise<NavCategory[]> {
  if (cachedCategories) return cachedCategories;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const res = await fetch("/api/categories", { signal: AbortSignal.timeout(10000) });
      if (!res.ok) return [];
      const data = await res.json();
      const cats = (data.categories || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      }));
      cachedCategories = cats;
      return cats;
    } catch {
      return [];
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

export function useCategories() {
  const [categories, setCategories] = useState<NavCategory[]>(cachedCategories || []);
  const [loading, setLoading] = useState(!cachedCategories);

  useEffect(() => {
    let active = true;

    fetchCategoriesFromAPI().then((cats) => {
      if (active) {
        setCategories(cats);
        setLoading(false);
      }
    });

    return () => { active = false; };
  }, []);

  return { categories, loading };
}

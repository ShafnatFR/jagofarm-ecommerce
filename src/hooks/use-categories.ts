"use client";

import { useState, useEffect } from "react";

export interface NavCategory {
  id: string;
  name: string;
  slug: string;
}

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  children: CategoryNode[];
}

export function useCategories() {
  const [categories, setCategories] = useState<NavCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        // Flatten: take root categories (API returns tree with children)
        const roots: CategoryNode[] = data.categories || [];
        const flat: NavCategory[] = roots.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
        }));
        setCategories(flat);
      } catch {
        // silently fail — show empty
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading };
}

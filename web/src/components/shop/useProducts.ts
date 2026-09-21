"use client";

import { useEffect, useState } from "react";

export type LookupProduct = {
  slug: string;
  name: string;
  price: number;
  oldPrice: number | null;
  sku: string | null;
  stock: string;
  rating: number;
  ratingCount: number;
  image: string;
  specs: { key: string; value: string }[];
};

/** Loads fresh product details for a list of slugs (keeps the list order). */
export function useProducts(slugs: string[], ready: boolean) {
  const [items, setItems] = useState<LookupProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const key = slugs.join(",");

  useEffect(() => {
    if (!ready) return;
    if (!key) {
      setItems([]);
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    fetch(`/api/products/lookup?slugs=${encodeURIComponent(key)}`)
      .then((r) => r.json())
      .then((d) => live && setItems(d.products ?? []))
      .catch(() => live && setItems([]))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [key, ready]);

  return { items, loading };
}

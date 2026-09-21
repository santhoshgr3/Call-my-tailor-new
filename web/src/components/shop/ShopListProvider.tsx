"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/** Wish list + compare list, kept in the visitor's browser (no account needed). */
type Ctx = {
  wishlist: string[];
  compare: string[];
  ready: boolean;
  toggleWish: (slug: string) => boolean;
  toggleCompare: (slug: string) => "added" | "removed" | "full";
  removeWish: (slug: string) => void;
  removeCompare: (slug: string) => void;
  clearCompare: () => void;
};

const WISH_KEY = "cmt_wishlist_v1";
const CMP_KEY = "cmt_compare_v1";
export const COMPARE_MAX = 4;

const C = createContext<Ctx | null>(null);

function read(key: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(v) ? v.filter((s) => typeof s === "string").slice(0, 100) : [];
  } catch {
    return [];
  }
}

export function ShopListProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [compare, setCompare] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setWishlist(read(WISH_KEY));
    setCompare(read(CMP_KEY).slice(0, COMPARE_MAX));
    setReady(true);
    // keep several tabs in step
    const onStorage = (e: StorageEvent) => {
      if (e.key === WISH_KEY) setWishlist(read(WISH_KEY));
      if (e.key === CMP_KEY) setCompare(read(CMP_KEY).slice(0, COMPARE_MAX));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
      localStorage.setItem(CMP_KEY, JSON.stringify(compare));
    } catch {}
  }, [wishlist, compare, ready]);

  const toggleWish = useCallback(
    (slug: string) => {
      const has = wishlist.includes(slug);
      setWishlist((w) => (has ? w.filter((s) => s !== slug) : [slug, ...w]));
      return !has;
    },
    [wishlist],
  );

  const toggleCompare = useCallback(
    (slug: string): "added" | "removed" | "full" => {
      if (compare.includes(slug)) {
        setCompare((c) => c.filter((s) => s !== slug));
        return "removed";
      }
      if (compare.length >= COMPARE_MAX) return "full";
      setCompare((c) => [...c, slug]);
      return "added";
    },
    [compare],
  );

  const value = useMemo<Ctx>(
    () => ({
      wishlist,
      compare,
      ready,
      toggleWish,
      toggleCompare,
      removeWish: (slug) => setWishlist((w) => w.filter((s) => s !== slug)),
      removeCompare: (slug) => setCompare((c) => c.filter((s) => s !== slug)),
      clearCompare: () => setCompare([]),
    }),
    [wishlist, compare, ready, toggleWish, toggleCompare],
  );

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useShopLists() {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useShopLists must be used within ShopListProvider");
  return ctx;
}

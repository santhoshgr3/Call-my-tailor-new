"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CartLine, lineKey, cartTotals } from "@/lib/cart-types";

type AddInput = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  qty?: number;
  options?: Record<string, string>;
};

type CartCtx = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  ready: boolean;
  add: (input: AddInput) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
};

const Ctx = createContext<CartCtx | null>(null);
const STORAGE = "cmt_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE, JSON.stringify(lines));
    } catch {}
  }, [lines, ready]);

  const add = useCallback((input: AddInput) => {
    const options = input.options ?? {};
    const key = lineKey(input.productId, options);
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) =>
          l.key === key ? { ...l, qty: l.qty + (input.qty ?? 1) } : l,
        );
      }
      return [
        ...prev,
        {
          productId: input.productId,
          slug: input.slug,
          name: input.name,
          price: input.price,
          image: input.image,
          qty: input.qty ?? 1,
          options,
          key,
        },
      ];
    });
    setDrawerOpen(true);
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, qty: Math.max(0, qty) } : l))
        .filter((l) => l.qty > 0),
    );
  }, []);

  const remove = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const { subtotal, count } = useMemo(() => cartTotals(lines), [lines]);

  const value: CartCtx = {
    lines,
    count,
    subtotal,
    ready,
    add,
    setQty,
    remove,
    clear,
    drawerOpen,
    setDrawerOpen,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";

export type VisitItem = {
  id: string;
  title: string;
  category: string;
  price: number;
  fabricFrom: number;
  image: string;
  qty: number;
  hasFabric: "yes" | "no";
};

type Action =
  | { type: "load"; items: VisitItem[] }
  | { type: "add"; item: Omit<VisitItem, "qty" | "hasFabric"> }
  | { type: "remove"; id: string }
  | { type: "qty"; id: string; qty: number }
  | { type: "fabric"; id: string; value: "yes" | "no" }
  | { type: "clear" };

const KEY = "cmt_visit_selection_v1";

function reducer(state: VisitItem[], a: Action): VisitItem[] {
  switch (a.type) {
    case "load":
      return a.items;
    case "add":
      return state.some((i) => i.id === a.item.id)
        ? state.map((i) => (i.id === a.item.id ? { ...i, qty: i.qty + 1 } : i))
        : [...state, { ...a.item, qty: 1, hasFabric: "no" }];
    case "remove":
      return state.filter((i) => i.id !== a.id);
    case "qty":
      return state.map((i) => (i.id === a.id ? { ...i, qty: a.qty } : i)).filter((i) => i.qty > 0);
    case "fabric":
      return state.map((i) => (i.id === a.id ? { ...i, hasFabric: a.value } : i));
    case "clear":
      return [];
  }
}

type Ctx = {
  ready: boolean;
  cart: VisitItem[];
  totalCount: number;
  totalPrice: number;
  add: (item: Omit<VisitItem, "qty" | "hasFabric">) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  setFabric: (id: string, value: "yes" | "no") => void;
  clear: () => void;
};

const BookingCtx = createContext<Ctx | null>(null);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [cart, dispatch] = useReducer(reducer, []);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const items = JSON.parse(raw) as VisitItem[];
        if (Array.isArray(items)) dispatch({ type: "load", items });
      }
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(cart));
    } catch {
      /* private mode */
    }
  }, [cart, ready]);

  const value = useMemo<Ctx>(
    () => ({
      ready,
      cart,
      totalCount: cart.reduce((s, i) => s + i.qty, 0),
      totalPrice: cart.reduce((s, i) => s + i.price * i.qty, 0),
      add: (item) => dispatch({ type: "add", item }),
      remove: (id) => dispatch({ type: "remove", id }),
      setQty: (id, qty) => dispatch({ type: "qty", id, qty }),
      setFabric: (id, value) => dispatch({ type: "fabric", id, value }),
      clear: () => dispatch({ type: "clear" }),
    }),
    [cart, ready],
  );

  return <BookingCtx.Provider value={value}>{children}</BookingCtx.Provider>;
}

export function useVisit() {
  const c = useContext(BookingCtx);
  if (!c) throw new Error("useVisit must be used inside BookingProvider");
  return c;
}

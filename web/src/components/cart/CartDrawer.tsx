"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import { formatINR } from "@/lib/money";

export function CartDrawer() {
  const { lines, subtotal, count, drawerOpen, setDrawerOpen, setQty, remove } = useCart();

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity ${
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setDrawerOpen(false)}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-[min(92vw,400px)] flex-col bg-white shadow-pop transition-transform ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h3 className="text-sm font-bold uppercase">Cart ({count})</h3>
          <button onClick={() => setDrawerOpen(false)} aria-label="Close" className="text-xl">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {lines.length === 0 ? (
            <p className="py-10 text-center text-sm text-faint">Your cart is empty.</p>
          ) : (
            <ul className="space-y-4">
              {lines.map((l) => (
                <li key={l.key} className="flex gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={l.image}
                    alt={l.name}
                    className="h-20 w-16 shrink-0 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/product/${l.slug}`}
                      onClick={() => setDrawerOpen(false)}
                      className="line-clamp-2 text-[13px] font-semibold hover:text-brand"
                    >
                      {l.name}
                    </Link>
                    {Object.entries(l.options).map(([k, v]) => (
                      <p key={k} className="text-[11px] text-faint">
                        {k}: {v}
                      </p>
                    ))}
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex items-center border border-line text-xs">
                        <button className="px-2 py-0.5" onClick={() => setQty(l.key, l.qty - 1)}>
                          −
                        </button>
                        <span className="px-2">{l.qty}</span>
                        <button className="px-2 py-0.5" onClick={() => setQty(l.key, l.qty + 1)}>
                          +
                        </button>
                      </div>
                      <span className="text-[13px] font-bold text-brand">
                        {formatINR(l.price * l.qty)}
                      </span>
                      <button
                        onClick={() => remove(l.key)}
                        className="ml-auto text-[11px] text-faint hover:text-brand"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-line p-4">
            <div className="mb-3 flex items-center justify-between text-sm font-bold">
              <span>Subtotal</span>
              <span className="text-brand">{formatINR(subtotal)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/cart"
                onClick={() => setDrawerOpen(false)}
                className="btn-outline w-full"
              >
                View Cart
              </Link>
              <Link
                href="/checkout"
                onClick={() => setDrawerOpen(false)}
                className="btn-brand w-full"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

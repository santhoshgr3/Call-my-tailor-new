"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { formatINR } from "@/lib/money";

export function CartView({
  store,
}: {
  store: { shipping_fee: number; free_shipping_over: number };
}) {
  const { lines, subtotal, setQty, remove, ready } = useCart();

  if (!ready) return <p className="text-sm text-faint">Loading…</p>;

  if (lines.length === 0) {
    return (
      <div className="rounded border border-line p-12 text-center">
        <p className="text-sm text-faint">Your cart is empty.</p>
        <Link href="/" className="btn-brand mt-4">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const shipping =
    subtotal >= store.free_shipping_over || subtotal === 0 ? 0 : store.shipping_fee;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0 border border-line text-sm">
        <div className="hidden bg-soft px-3 py-2 text-xs font-bold uppercase text-faint sm:grid sm:grid-cols-[1fr_90px_110px_100px_28px] sm:gap-3">
          <span>Product</span>
          <span>Price</span>
          <span>Qty</span>
          <span className="text-right">Total</span>
          <span />
        </div>
        {lines.map((l) => (
          <div
            key={l.key}
            className="relative grid gap-3 border-t border-line p-3 first:border-t-0 sm:grid-cols-[1fr_90px_110px_100px_28px] sm:items-start sm:border-t-0 sm:border-b sm:last:border-b-0"
          >
            <div className="flex min-w-0 gap-3 pr-6 sm:pr-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.image} alt={l.name} className="h-20 w-16 shrink-0 rounded object-cover" />
              <div className="min-w-0">
                <Link href={`/product/${l.slug}`} className="font-semibold hover:text-brand">
                  {l.name}
                </Link>
                {Object.entries(l.options).map(([k, v]) => (
                  <p key={k} className="break-words text-xs text-faint">
                    {k}: {v}
                  </p>
                ))}
                <p className="mt-1 text-sm sm:hidden">{formatINR(l.price)}</p>
              </div>
            </div>
            <div className="hidden sm:block">{formatINR(l.price)}</div>
            <div className="flex items-center justify-between sm:block">
              <div className="flex w-fit items-center border border-line">
                <button
                  aria-label="Decrease quantity"
                  className="px-3 py-1.5 sm:px-2 sm:py-1"
                  onClick={() => setQty(l.key, l.qty - 1)}
                >
                  −
                </button>
                <span className="w-8 text-center">{l.qty}</span>
                <button
                  aria-label="Increase quantity"
                  className="px-3 py-1.5 sm:px-2 sm:py-1"
                  onClick={() => setQty(l.key, l.qty + 1)}
                >
                  +
                </button>
              </div>
              <span className="font-semibold text-brand sm:hidden">{formatINR(l.price * l.qty)}</span>
            </div>
            <div className="hidden text-right font-semibold text-brand sm:block">
              {formatINR(l.price * l.qty)}
            </div>
            <button
              onClick={() => remove(l.key)}
              aria-label={`Remove ${l.name}`}
              className="absolute right-2 top-2 p-1 text-faint hover:text-brand sm:static sm:text-right"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <aside className="h-fit rounded border border-line p-5 text-sm">
        <h3 className="mb-3 text-sm font-bold uppercase">Order Summary</h3>
        <div className="flex justify-between py-1">
          <span className="text-muted">Subtotal</span>
          <span>{formatINR(subtotal)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-muted">Shipping</span>
          <span>{shipping ? formatINR(shipping) : "Free"}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-line pt-2 text-base font-bold">
          <span>Total</span>
          <span className="text-brand">{formatINR(subtotal + shipping)}</span>
        </div>
        <Link href="/checkout" className="btn-brand mt-4 w-full">
          Proceed to Checkout
        </Link>
        <Link
          href="/"
          className="mt-2 block text-center text-xs font-semibold text-muted hover:text-brand"
        >
          Continue Shopping
        </Link>
      </aside>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { formatINR } from "@/lib/money";

export function CartView() {
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

  const shipping = subtotal >= 4999 || subtotal === 0 ? 0 : 199;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border border-line text-sm">
          <thead className="bg-soft text-left text-xs uppercase text-faint">
            <tr>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.key} className="border-t border-line align-top">
                <td className="px-3 py-3">
                  <div className="flex gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={l.image}
                      alt={l.name}
                      className="h-20 w-16 shrink-0 rounded object-cover"
                    />
                    <div>
                      <Link
                        href={`/product/${l.slug}`}
                        className="font-semibold hover:text-brand"
                      >
                        {l.name}
                      </Link>
                      {Object.entries(l.options).map(([k, v]) => (
                        <p key={k} className="text-xs text-faint">
                          {k}: {v}
                        </p>
                      ))}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">{formatINR(l.price)}</td>
                <td className="px-3 py-3">
                  <div className="flex w-fit items-center border border-line">
                    <button className="px-2 py-1" onClick={() => setQty(l.key, l.qty - 1)}>
                      −
                    </button>
                    <span className="w-8 text-center">{l.qty}</span>
                    <button className="px-2 py-1" onClick={() => setQty(l.key, l.qty + 1)}>
                      +
                    </button>
                  </div>
                </td>
                <td className="px-3 py-3 text-right font-semibold text-brand">
                  {formatINR(l.price * l.qty)}
                </td>
                <td className="px-3 py-3 text-right">
                  <button
                    onClick={() => remove(l.key)}
                    className="text-xs text-faint hover:text-brand"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

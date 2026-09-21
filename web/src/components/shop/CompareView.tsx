"use client";

import Link from "next/link";
import { useShopLists } from "./ShopListProvider";
import { useProducts } from "./useProducts";
import { formatINR } from "@/lib/money";

export function CompareView() {
  const { compare, ready, removeCompare, clearCompare } = useShopLists();
  const { items, loading } = useProducts(compare, ready);

  if (!ready || loading) return <p className="py-16 text-center text-sm text-faint">Loading…</p>;

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-semibold text-ink">Nothing to compare yet</p>
        <p className="mt-1 text-sm text-faint">
          Use “Compare this Product” on up to 4 products to see them side by side.
        </p>
        <Link href="/" className="btn-brand mt-6 inline-flex">
          Continue shopping
        </Link>
      </div>
    );
  }

  const keys = Array.from(new Set(items.flatMap((p) => p.specs.map((s) => s.key))));
  const specOf = (p: (typeof items)[number], k: string) => p.specs.find((s) => s.key === k)?.value ?? "—";
  const cell = "border border-line p-3 align-top";
  const label = `${cell} w-36 bg-soft text-xs font-bold uppercase text-faint`;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <tbody>
            <tr>
              <td className={label}>Product</td>
              {items.map((p) => (
                <td key={p.slug} className={cell}>
                  <Link href={`/product/${p.slug}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt={p.name} className="mb-2 h-40 w-32 border border-line object-cover" />
                  </Link>
                  <Link href={`/product/${p.slug}`} className="font-semibold text-ink hover:text-brand">
                    {p.name}
                  </Link>
                </td>
              ))}
            </tr>
            <tr>
              <td className={label}>Price</td>
              {items.map((p) => (
                <td key={p.slug} className={`${cell} font-bold`}>
                  {formatINR(p.price)}
                  {p.oldPrice ? (
                    <span className="ml-2 text-xs font-normal text-faint line-through">{formatINR(p.oldPrice)}</span>
                  ) : null}
                </td>
              ))}
            </tr>
            <tr>
              <td className={label}>Availability</td>
              {items.map((p) => (
                <td key={p.slug} className={cell}>
                  {/out of stock/i.test(p.stock) ? "Out of stock" : "In stock"}
                </td>
              ))}
            </tr>
            <tr>
              <td className={label}>SKU</td>
              {items.map((p) => (
                <td key={p.slug} className={cell}>
                  {p.sku || "—"}
                </td>
              ))}
            </tr>
            <tr>
              <td className={label}>Rating</td>
              {items.map((p) => (
                <td key={p.slug} className={cell}>
                  {p.ratingCount > 0 ? `${p.rating.toFixed(1)} / 5 (${p.ratingCount})` : "No reviews"}
                </td>
              ))}
            </tr>
            {keys.map((k) => (
              <tr key={k}>
                <td className={label}>{k}</td>
                {items.map((p) => (
                  <td key={p.slug} className={cell}>
                    {specOf(p, k)}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className={label} />
              {items.map((p) => (
                <td key={p.slug} className={cell}>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/product/${p.slug}`} className="btn-brand !px-4 !py-2 !text-[11px]">
                      View &amp; order
                    </Link>
                    <button onClick={() => removeCompare(p.slug)} className="btn-outline !px-3 !py-2 !text-[11px]">
                      Remove
                    </button>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <button onClick={clearCompare} className="mt-4 text-xs font-semibold text-faint hover:text-brand">
        Clear comparison
      </button>
    </div>
  );
}

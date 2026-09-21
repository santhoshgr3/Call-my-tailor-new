"use client";

import Link from "next/link";
import { useShopLists } from "./ShopListProvider";
import { useProducts } from "./useProducts";
import { formatINR } from "@/lib/money";

export function WishlistView() {
  const { wishlist, ready, removeWish, toggleCompare, compare } = useShopLists();
  const { items, loading } = useProducts(wishlist, ready);

  if (!ready || loading) return <p className="py-16 text-center text-sm text-faint">Loading…</p>;

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-semibold text-ink">Your wish list is empty</p>
        <p className="mt-1 text-sm text-faint">
          Tap “Add to Wish List” on any product to save it here.
        </p>
        <Link href="/" className="btn-brand mt-6 inline-flex">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border border-line text-sm">
        <thead className="bg-soft text-left text-xs font-bold uppercase text-faint">
          <tr>
            <th className="w-24 p-3">Image</th>
            <th className="p-3">Product</th>
            <th className="p-3">Stock</th>
            <th className="p-3">Price</th>
            <th className="p-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.slug} className="border-t border-line align-middle">
              <td className="p-3">
                <Link href={`/product/${p.slug}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={p.name} className="h-20 w-16 border border-line object-cover" />
                </Link>
              </td>
              <td className="p-3">
                <Link href={`/product/${p.slug}`} className="font-semibold text-ink hover:text-brand">
                  {p.name}
                </Link>
                {p.sku && <p className="text-xs text-faint">SKU: {p.sku}</p>}
              </td>
              <td className="p-3">{/out of stock/i.test(p.stock) ? "Out of stock" : "In stock"}</td>
              <td className="p-3 font-bold">
                {formatINR(p.price)}
                {p.oldPrice ? (
                  <span className="ml-2 text-xs font-normal text-faint line-through">{formatINR(p.oldPrice)}</span>
                ) : null}
              </td>
              <td className="p-3">
                <div className="flex flex-wrap justify-end gap-2">
                  <Link href={`/product/${p.slug}`} className="btn-brand !px-4 !py-2 !text-[11px]">
                    View &amp; order
                  </Link>
                  <button
                    onClick={() => toggleCompare(p.slug)}
                    className="btn-outline !px-3 !py-2 !text-[11px]"
                  >
                    {compare.includes(p.slug) ? "In compare ✓" : "Compare"}
                  </button>
                  <button
                    onClick={() => removeWish(p.slug)}
                    aria-label={`Remove ${p.name} from wish list`}
                    className="px-2 text-lg text-faint hover:text-brand"
                  >
                    ✕
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

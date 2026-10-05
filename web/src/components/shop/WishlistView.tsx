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
    <ul className="divide-y divide-line border border-line text-sm">
      {items.map((p) => (
        <li key={p.slug} className="relative flex gap-3 p-3 sm:items-center sm:gap-4">
          <Link href={`/product/${p.slug}`} className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image} alt={p.name} className="h-24 w-[72px] border border-line object-cover sm:h-20 sm:w-16" />
          </Link>
          <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <Link href={`/product/${p.slug}`} className="block pr-6 font-semibold text-ink hover:text-brand sm:pr-0">
                {p.name}
              </Link>
              {p.sku && <p className="text-xs text-faint">SKU: {p.sku}</p>}
              <p className="mt-1 font-bold">
                {formatINR(p.price)}
                {p.oldPrice ? (
                  <span className="ml-2 text-xs font-normal text-faint line-through">{formatINR(p.oldPrice)}</span>
                ) : null}
                <span className="ml-2 text-xs font-normal text-faint">
                  · {/out of stock/i.test(p.stock) ? "Out of stock" : "In stock"}
                </span>
              </p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 sm:mt-0 sm:justify-end">
              <Link href={`/product/${p.slug}`} className="btn-brand !px-4 !py-2 !text-[11px]">
                View &amp; order
              </Link>
              <button onClick={() => toggleCompare(p.slug)} className="btn-outline !px-3 !py-2 !text-[11px]">
                {compare.includes(p.slug) ? "In compare ✓" : "Compare"}
              </button>
              <button
                onClick={() => removeWish(p.slug)}
                aria-label={`Remove ${p.name} from wish list`}
                className="absolute right-1 top-1 px-2 text-lg text-faint hover:text-brand sm:static"
              >
                ✕
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

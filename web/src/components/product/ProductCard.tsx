import Link from "next/link";
import { formatINR } from "@/lib/money";
import { Stars } from "@/components/ui/Stars";
import type { ProductCard as TCard } from "@/lib/catalog";
import { AddToCartButton } from "./AddToCartButton";

export function ProductCard({ p, compact = false }: { p: TCard; compact?: boolean }) {
  const img = p.images[0]?.url || "/img/placeholder.svg";
  const hover = p.images[1]?.url;
  const available = Math.max(0, 10 - (p.soldCount ?? 0));
  const pct = Math.max(4, Math.min(100, Math.round((available / 10) * 100)));
  return (
    <div className="group relative flex flex-col border border-line bg-white transition-shadow hover:shadow-pop">
      {p.isNewArrival && (
        <span className="absolute left-0 top-3 z-10 bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          New
        </span>
      )}
      <Link href={`/product/${p.slug}`} className="relative block overflow-hidden">
        <span className="block aspect-[3/4] w-full bg-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt={p.images[0]?.alt || p.name}
            loading="lazy"
            className="h-full w-full object-cover transition-opacity duration-300"
          />
          {hover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hover}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          )}
        </span>
      </Link>

      {!compact && (
        <div className="pointer-events-none absolute right-2 top-3 z-10 flex flex-col gap-1 opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100">
          <AddToCartButton
            product={{ productId: p.id, slug: p.slug, name: p.name, price: p.price, image: img }}
            className="grid h-8 w-8 place-items-center bg-brand-dark text-sm text-white transition-colors hover:bg-brand"
            label="🛒"
          />
          <button
            type="button"
            aria-label="Add to wishlist"
            className="grid h-8 w-8 place-items-center bg-brand-dark text-sm text-white transition-colors hover:bg-brand"
          >
            ♡
          </button>
          <button
            type="button"
            aria-label="Compare"
            className="grid h-8 w-8 place-items-center bg-brand-dark text-sm text-white transition-colors hover:bg-brand"
          >
            ⇄
          </button>
          <Link
            href={`/product/${p.slug}`}
            aria-label="Quick view"
            className="grid h-8 w-8 place-items-center bg-brand-dark text-sm text-white transition-colors hover:bg-brand"
          >
            👁
          </Link>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link
          href={`/product/${p.slug}`}
          className="line-clamp-2 min-h-[2.5em] text-[13px] font-semibold text-brand-dark hover:text-brand"
        >
          {p.name}
        </Link>
        {!compact && <Stars value={p.rating} count={p.ratingCount || undefined} />}
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-bold text-brand">{formatINR(p.price)}</span>
          {p.oldPrice ? (
            <span className="text-xs text-faint line-through">{formatINR(p.oldPrice)}</span>
          ) : null}
        </div>
        {!compact && (
          <div className="mt-auto pt-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 text-[10px] text-faint">
              Available: {available} / Sold: {p.soldCount ?? 0}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Home-page carousel card — matches the original site: image, a hover strip of
 * action icons, a light-grey footer with the product name and a bold red price.
 */
export function RailCard({ p }: { p: TCard }) {
  const img = p.images[0]?.url || "/img/placeholder.svg";
  const hover = p.images[1]?.url;
  return (
    <div className="group relative flex w-full flex-col bg-white">
      {p.isNewArrival && (
        <span className="absolute left-1/2 top-3 z-20 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full bg-green-500 text-[10px] font-bold uppercase text-white shadow">
          New
        </span>
      )}
      <Link href={`/product/${p.slug}`} className="relative block overflow-hidden">
        <span className="block aspect-[3/4] w-full bg-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt={p.images[0]?.alt || p.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          {hover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hover}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          )}
        </span>
      </Link>

      {/* hover action strip */}
      <div className="pointer-events-none absolute left-3 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1 opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100">
        <RailAction p={p} img={img} />
        <Link
          href={`/product/${p.slug}`}
          aria-label="Quick view"
          className="grid h-9 w-9 place-items-center bg-brand-dark text-white transition-colors hover:bg-brand"
        >
          👁
        </Link>
      </div>

      <div className="bg-soft px-3 py-3 text-center">
        <Link
          href={`/product/${p.slug}`}
          className="line-clamp-1 text-[13px] font-semibold text-brand-dark hover:text-brand"
        >
          {p.name}
        </Link>
        <p className="mt-1 text-[15px] font-bold text-brand">{formatINR(p.price)}</p>
      </div>
    </div>
  );
}

function RailAction({ p, img }: { p: TCard; img: string }) {
  return (
    <AddToCartButton
      product={{ productId: p.id, slug: p.slug, name: p.name, price: p.price, image: img }}
      className="grid h-9 w-9 place-items-center bg-brand-dark text-white transition-colors hover:bg-brand"
      label="🛍"
    />
  );
}

import Link from "next/link";
import { formatINR } from "@/lib/money";
import { Stars } from "@/components/ui/Stars";
import type { ProductCard as TCard } from "@/lib/catalog";
import { AddToCartButton } from "./AddToCartButton";

export function ProductCard({ p, compact = false }: { p: TCard; compact?: boolean }) {
  const img = p.images[0]?.url || "/img/placeholder.svg";
  const hover = p.images[1]?.url;
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
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link
          href={`/product/${p.slug}`}
          className="line-clamp-2 min-h-[2.5em] text-[13px] font-semibold text-brand-dark hover:text-brand"
        >
          {p.name}
        </Link>
        {!compact && <Stars value={p.rating} count={p.ratingCount || undefined} />}
        <div className="mt-auto flex items-center gap-2">
          <span className="text-[15px] font-bold text-brand">{formatINR(p.price)}</span>
          {p.oldPrice ? (
            <span className="text-xs text-faint line-through">{formatINR(p.oldPrice)}</span>
          ) : null}
        </div>
        {!compact && (
          <AddToCartButton
            product={{
              productId: p.id,
              slug: p.slug,
              name: p.name,
              price: p.price,
              image: img,
            }}
            className="btn-brand mt-1 w-full !py-2 !text-[11px]"
            label="Add to Cart"
          />
        )}
      </div>
    </div>
  );
}

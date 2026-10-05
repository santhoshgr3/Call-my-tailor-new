"use client";

import { useRef } from "react";
import { ProductCard } from "./ProductCard";
import type { ProductCard as TCard } from "@/lib/catalog";

/** One row of product cards that scrolls sideways (arrows + swipe). */
export function RelatedCarousel({ items }: { items: TCard[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const by = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };
  return (
    <div className="relative mt-6">
      <div
        ref={ref}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2"
      >
        {items.map((rp) => (
          <div key={rp.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] md:w-[23.5%] lg:w-[19%]">
            <ProductCard p={rp} compact />
          </div>
        ))}
      </div>
      {items.length > 2 && (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={() => by(-1)}
            className="absolute -left-3 top-1/3 hidden h-9 w-9 place-items-center rounded-full bg-white text-lg shadow-pop hover:bg-brand hover:text-white md:grid"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => by(1)}
            className="absolute -right-3 top-1/3 hidden h-9 w-9 place-items-center rounded-full bg-white text-lg shadow-pop hover:bg-brand hover:text-white md:grid"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}

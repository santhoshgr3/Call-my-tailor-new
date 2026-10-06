"use client";

import { useRef, useState } from "react";
import { RailCard } from "@/components/product/ProductCard";
import type { ProductCard as TCard } from "@/lib/catalog";

export function ProductTabs({
  heading,
  tabs,
}: {
  heading?: string;
  tabs: { label: string; items: TCard[] }[];
}) {
  const [active, setActive] = useState(0);
  const current = tabs[active] ?? tabs[0];
  const railRef = useRef<HTMLDivElement>(null);

  function scrollBy(dir: -1 | 1) {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 900), behavior: "smooth" });
  }

  return (
    <div>
      <div className="section-head">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          {heading && <h2 className="text-brand-dark">{heading}</h2>}
          <div className="hidden flex-wrap items-center gap-x-5 md:flex">
            {tabs.map((t, i) => (
              <button
                key={t.label}
                onClick={() => setActive(i)}
                className={`text-xs font-bold uppercase tracking-wide transition-colors ${
                  i === active ? "text-brand" : "text-faint hover:text-brand-dark"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            aria-label="Previous"
            onClick={() => scrollBy(-1)}
            className="grid h-7 w-7 place-items-center text-faint hover:text-brand"
          >
            ‹
          </button>
          <button
            aria-label="Next"
            onClick={() => scrollBy(1)}
            className="grid h-7 w-7 place-items-center text-faint hover:text-brand"
          >
            ›
          </button>
        </div>
      </div>

      {tabs.length > 1 && (
        <select
          aria-label="Choose a list"
          value={active}
          onChange={(e) => setActive(Number(e.target.value))}
          className="mt-4 w-full rounded border border-line bg-white px-3 py-2.5 text-sm font-semibold uppercase text-brand-dark outline-none focus:border-brand md:hidden"
        >
          {tabs.map((tb, i) => (
            <option key={tb.label} value={i}>
              {tb.label}
            </option>
          ))}
        </select>
      )}

      <div
        ref={railRef}
        className="no-scrollbar mt-4 flex snap-x gap-3 overflow-x-auto pb-2 md:mt-6 md:gap-4"
      >
        {current.items.map((p) => (
          <div key={p.id} className="w-[45%] shrink-0 snap-start sm:w-[31%] lg:w-[19%]">
            <RailCard p={p} />
          </div>
        ))}
        {current.items.length === 0 && (
          <p className="py-10 text-sm text-faint">No items to show yet.</p>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import type { ProductCard as TCard } from "@/lib/catalog";

export function ProductTabs({
  tabs,
}: {
  tabs: { label: string; items: TCard[] }[];
}) {
  const [active, setActive] = useState(0);
  const current = tabs[active] ?? tabs[0];

  return (
    <div>
      <div className="mb-5 flex flex-wrap justify-center gap-1 border-b border-line">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            onClick={() => setActive(i)}
            className={`-mb-px border-b-2 px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
              i === active
                ? "border-brand text-brand"
                : "border-transparent text-faint hover:text-brand-dark"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {current.items.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}

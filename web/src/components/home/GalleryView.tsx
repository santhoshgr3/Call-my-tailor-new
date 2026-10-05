"use client";

import { useMemo, useState } from "react";

type Item = { id: string; imageUrl: string; category: string; caption: string | null };

export function GalleryView({ items }: { items: Item[] }) {
  const cats = useMemo(() => Array.from(new Set(items.map((i) => i.category).filter(Boolean))), [items]);
  const [tab, setTab] = useState("All Work");
  const [shown, setShown] = useState(24);
  const [lightbox, setLightbox] = useState<Item | null>(null);
  const visible = tab === "All Work" ? items : items.filter((i) => i.category === tab);

  const pill = (label: string) => (
    <button
      key={label}
      onClick={() => {
        setTab(label);
        setShown(24);
      }}
      className={`rounded px-3 py-1.5 text-xs font-semibold ${
        tab === label ? "bg-brand text-white" : "bg-[#dcdcdc] text-brand-dark hover:bg-brand/10"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">{["All Work", ...cats].map(pill)}</div>
      {visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-faint">No photos here yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
          {visible.slice(0, shown).map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setLightbox(g)}
              className="group overflow-hidden bg-soft shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={g.imageUrl}
                alt={g.caption || "Our work"}
                loading="lazy"
                className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      )}
      {visible.length > shown && (
        <div className="mt-6 text-center">
          <button onClick={() => setShown((n) => n + 24)} className="btn-outline">
            Load more
          </button>
        </div>
      )}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/85 p-4"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute right-4 top-3 text-3xl leading-none text-white" aria-label="Close">
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.imageUrl}
            alt={lightbox.caption || "Our work"}
            className="max-h-[90vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

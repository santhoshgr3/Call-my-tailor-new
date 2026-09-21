"use client";

import { useState } from "react";

export function ProductGallery({
  images,
  name,
  badge,
}: {
  images: { url: string; alt: string | null }[];
  name: string;
  badge?: string;
}) {
  const list = images.length ? images : [{ url: "/img/placeholder.svg", alt: name }];
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-start">
      {list.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto sm:max-h-[560px] sm:w-[76px] sm:shrink-0 sm:flex-col sm:overflow-y-auto sm:overflow-x-hidden">
          {list.map((im, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              className={`aspect-square w-[72px] shrink-0 overflow-hidden border-2 bg-white p-0.5 transition-colors sm:w-full ${
                i === active ? "border-[#1f2d5a]" : "border-line hover:border-[#9aa3c0]"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={im.url} alt={im.alt || ""} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="relative min-w-0 flex-1 border border-line bg-white">
        {badge && (
          <span className="absolute right-2 top-2 z-10 rounded-sm bg-[#1a4fd6] px-2 py-1 text-[10px] font-bold uppercase leading-none tracking-wide text-white">
            {badge}
          </span>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={list[active].url}
          alt={list[active].alt || name}
          className="mx-auto max-h-[640px] w-full object-contain"
        />
      </div>
    </div>
  );
}

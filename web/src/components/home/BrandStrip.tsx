"use client";

import { useRef } from "react";

export function BrandStrip({
  brands,
}: {
  brands: { id: string; name: string; logoUrl: string }[];
}) {
  const railRef = useRef<HTMLDivElement>(null);

  function scrollBy(dir: -1 | 1) {
    railRef.current?.scrollBy({ left: dir * 260, behavior: "smooth" });
  }

  return (
    <div className="relative overflow-hidden rounded">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/fabric-bg.jpg"
        alt="Our fabric brands"
        className="h-[220px] w-full object-cover sm:h-[280px] md:h-[340px]"
      />
      <div className="absolute inset-x-0 bottom-0 bg-black/55 py-4">
        <div className="flex items-center gap-2 px-3 sm:gap-3 sm:px-4">
          <button
            aria-label="Previous"
            onClick={() => scrollBy(-1)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/90 text-lg text-brand-dark hover:bg-white"
          >
            ‹
          </button>
          <div ref={railRef} className="no-scrollbar flex flex-1 gap-3 overflow-x-auto scroll-smooth">
            {brands.map((b) => (
              <div
                key={b.id}
                className="flex h-16 w-[100px] shrink-0 items-center justify-center bg-white p-2 sm:w-[120px]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.logoUrl} alt={b.name} className="h-full w-full object-contain" />
              </div>
            ))}
          </div>
          <button
            aria-label="Next"
            onClick={() => scrollBy(1)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/90 text-lg text-brand-dark hover:bg-white"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

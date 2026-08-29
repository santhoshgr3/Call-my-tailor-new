"use client";

import { useEffect, useState } from "react";

type Slide = { imageUrl: string; headline: string | null; link: string | null };

export function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const n = slides.length;

  useEffect(() => {
    if (n <= 1) return;
    const t = setInterval(() => setI((v) => (v + 1) % n), 4500);
    return () => clearInterval(t);
  }, [n]);

  if (n === 0) return null;

  return (
    <div className="relative h-full min-h-[280px] overflow-hidden rounded md:min-h-[420px]">
      {slides.map((s, idx) => (
        <a
          key={idx}
          href={s.link || "#"}
          className={`absolute inset-0 transition-opacity duration-700 ${
            idx === i ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.imageUrl} alt={s.headline || "slide"} className="h-full w-full object-cover" />
        </a>
      ))}
      {n > 1 && (
        <>
          <button
            aria-label="Previous"
            onClick={() => setI((v) => (v - 1 + n) % n)}
            className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-lg"
          >
            ‹
          </button>
          <button
            aria-label="Next"
            onClick={() => setI((v) => (v + 1) % n)}
            className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-lg"
          >
            ›
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                aria-label={`Go to slide ${idx + 1}`}
                onClick={() => setI(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === i ? "w-5 bg-brand" : "w-2 bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

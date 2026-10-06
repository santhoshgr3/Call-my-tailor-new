"use client";

import { useRef, useState } from "react";

type Vlog = { id: string; title: string; videoUrl: string };

function toVideoId(url: string): string {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : url.trim();
}

/** YouTube vlogs: three wide video cards across (swipe/arrows for more); tap to play in place. */
export function VlogGrid({ items }: { items: Vlog[] }) {
  const [playing, setPlaying] = useState<string | null>(null);
  const rail = useRef<HTMLDivElement>(null);
  if (items.length === 0) return null;

  const step = (dir: 1 | -1) => {
    const el = rail.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={rail}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3 md:gap-5"
      >
        {items.map((v) => {
          const id = toVideoId(v.videoUrl);
          const on = playing === v.id;
          return (
            <div
              key={v.id}
              className="relative aspect-video w-[86%] shrink-0 snap-center overflow-hidden rounded-lg bg-black shadow-card sm:w-[48.5%] md:w-[calc((100%-2.5rem)/3)] md:snap-start"
            >
              {on ? (
                <iframe
                  src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
                  title={v.title}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setPlaying(v.id)}
                  aria-label={`Play ${v.title}`}
                  className="group absolute inset-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
                    alt={v.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute inset-0 grid place-items-center bg-black/10 transition-colors group-hover:bg-black/25">
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-[#ef3340] text-white shadow-lg transition-transform group-hover:scale-110">
                      <svg viewBox="0 0 24 24" className="ml-0.5 h-7 w-7 fill-current" aria-hidden>
                        <path d="M8 5.5v13l11-6.5z" />
                      </svg>
                    </span>
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {items.length > 3 && (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={() => step(-1)}
            className="absolute -left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-xl shadow-pop hover:bg-brand hover:text-white md:grid"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => step(1)}
            className="absolute -right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-xl shadow-pop hover:bg-brand hover:text-white md:grid"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}

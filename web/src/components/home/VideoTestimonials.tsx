"use client";

import { useEffect, useRef, useState } from "react";

type VideoTestimonial = {
  id: string;
  name: string;
  role: string | null;
  videoUrl: string;
};

function toVideoId(url: string): string {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : url.trim();
}

/** Every video is a card in one swipeable row — add as many as you like in Admin → Testimonials. */
export function VideoTestimonials({ items }: { items: VideoTestimonial[] }) {
  const videos = items.map((t) => ({ ...t, videoId: toVideoId(t.videoUrl) }));
  const n = videos.length;
  const rail = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const paused = useRef(false);

  const step = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const w = (card?.offsetWidth ?? el.clientWidth) + 16;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    if (dir === 1 && atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
    else el.scrollBy({ left: dir * w, behavior: "smooth" });
  };

  // gentle auto-advance, paused while a video plays or the visitor is touching/hovering
  useEffect(() => {
    if (n <= 1) return;
    const t = setInterval(() => {
      if (!paused.current && !playing) step(1);
    }, 4500);
    return () => clearInterval(t);
  }, [n, playing]);

  if (n === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onTouchStart={() => (paused.current = true)}
    >
      <div
        ref={rail}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-3"
      >
        {videos.map((v) => {
          const on = playing === v.id;
          return (
            <div key={v.id} className="w-[78%] shrink-0 snap-center sm:w-[44%] md:w-[31%] lg:w-[23.5%]">
              <div className="relative aspect-[9/13] overflow-hidden rounded-xl border border-line bg-black shadow-pop">
                {on ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${v.videoId}?autoplay=1&rel=0`}
                    title={v.name}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setPlaying(v.id)}
                    className="group relative block h-full w-full"
                    aria-label={`Play video: ${v.name}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`}
                      alt={v.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/35">
                      <span className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-xl text-brand shadow-lg transition-transform group-hover:scale-110">
                        ▶
                      </span>
                    </span>
                  </button>
                )}
              </div>
              <div className="relative mx-auto mt-2 w-fit max-w-full rounded-lg bg-soft px-4 py-1.5 text-center shadow-card">
                <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-soft" />
                <p className="relative truncate text-sm font-bold text-brand-dark">{v.name}</p>
              </div>
            </div>
          );
        })}
      </div>

      {n > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous video"
            onClick={() => step(-1)}
            className="absolute left-0 top-[42%] grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-xl shadow-pop hover:bg-brand hover:text-white"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next video"
            onClick={() => step(1)}
            className="absolute right-0 top-[42%] grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-xl shadow-pop hover:bg-brand hover:text-white"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}

"use client";

import { useRef, useState } from "react";

type VideoTestimonial = {
  id: string;
  name: string;
  role: string | null;
  videoUrl: string;
};

function toVideoId(url: string): string {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : url.trim();
}

export function VideoTestimonials({ items }: { items: VideoTestimonial[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const videos = items.map((t) => ({ ...t, videoId: toVideoId(t.videoUrl) }));

  function scrollBy(dir: -1 | 1) {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>("[data-card]");
    const amount = card ? card.offsetWidth + 20 : rail.clientWidth * 0.8;
    rail.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  if (videos.length === 0) return null;

  return (
    <div className="relative">
      <div
        ref={railRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-1"
      >
        {videos.map((v) => (
          <div
            key={v.id}
            data-card
            className="w-[78%] shrink-0 snap-start sm:w-[45%] lg:w-[31%]"
          >
            <div className="relative overflow-hidden rounded-lg border border-line bg-black shadow-card">
              <div className="relative aspect-video w-full">
                {playingId === v.id ? (
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
                    onClick={() => setPlayingId(v.id)}
                    className="group relative block h-full w-full"
                    aria-label={`Play video: ${v.name}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`}
                      alt={v.name}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/40">
                      <span className="grid h-14 w-14 place-items-center rounded-full bg-brand text-xl text-white shadow-lg transition-transform group-hover:scale-110">
                        ▶
                      </span>
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {videos.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous videos"
            onClick={() => scrollBy(-1)}
            className="absolute left-[-14px] top-1/2 hidden -translate-y-1/2 place-items-center rounded-full bg-white text-lg text-brand-dark shadow-card hover:bg-soft sm:grid sm:h-10 sm:w-10"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next videos"
            onClick={() => scrollBy(1)}
            className="absolute right-[-14px] top-1/2 hidden -translate-y-1/2 place-items-center rounded-full bg-white text-lg text-brand-dark shadow-card hover:bg-soft sm:grid sm:h-10 sm:w-10"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}

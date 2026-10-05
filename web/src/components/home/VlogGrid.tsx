"use client";

import { useState } from "react";

type Vlog = { id: string; title: string; videoUrl: string };

function toVideoId(url: string): string {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : url.trim();
}

/** YouTube vlogs: thumbnails that turn into the player when tapped. */
export function VlogGrid({ items }: { items: Vlog[] }) {
  const [playing, setPlaying] = useState<string | null>(null);
  if (items.length === 0) return null;
  return (
    <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 no-scrollbar md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
      {items.map((v) => {
        const id = toVideoId(v.videoUrl);
        const on = playing === v.id;
        return (
          <div key={v.id} className="w-[78%] shrink-0 snap-start sm:w-[46%] md:w-auto">
            <div className="relative aspect-video overflow-hidden rounded bg-black">
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
                  <span className="absolute inset-0 grid place-items-center bg-black/20 transition-colors group-hover:bg-black/35">
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-brand text-xl text-white shadow-lg transition-transform group-hover:scale-110">
                      ▶
                    </span>
                  </span>
                </button>
              )}
            </div>
            <p className="mt-2 line-clamp-2 text-sm font-semibold text-brand-dark">{v.title}</p>
          </div>
        );
      })}
    </div>
  );
}

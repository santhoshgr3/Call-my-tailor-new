"use client";

import { useMemo, useState } from "react";

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

const PER_PAGE = 3;

export function VideoTestimonials({ items }: { items: VideoTestimonial[] }) {
  const videos = useMemo(
    () => items.map((t) => ({ ...t, videoId: toVideoId(t.videoUrl) })),
    [items],
  );
  const pages = Math.max(1, Math.ceil(videos.length / PER_PAGE));
  const [page, setPage] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const visible = videos.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  function go(dir: -1 | 1) {
    setPlayingId(null);
    setPage((p) => (p + dir + pages) % pages);
  }

  if (videos.length === 0) return null;

  return (
    <div className="relative">
      <div
        className={`grid gap-5 ${
          visible.length >= 3
            ? "sm:grid-cols-2 lg:grid-cols-3"
            : visible.length === 2
              ? "sm:grid-cols-2"
              : "mx-auto max-w-md"
        }`}
      >
        {visible.map((v) => (
          <div key={v.id}>
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

      {pages > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous videos"
            onClick={() => go(-1)}
            className="absolute left-[-14px] top-[38%] hidden -translate-y-1/2 place-items-center rounded-full bg-white text-lg text-brand-dark shadow-card hover:bg-soft sm:grid sm:h-9 sm:w-9"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next videos"
            onClick={() => go(1)}
            className="absolute right-[-14px] top-[38%] hidden -translate-y-1/2 place-items-center rounded-full bg-white text-lg text-brand-dark shadow-card hover:bg-soft sm:grid sm:h-9 sm:w-9"
          >
            ›
          </button>
          <div className="mt-5 flex justify-center gap-1.5">
            {Array.from({ length: pages }).map((_, i) => (
              <button
                key={i}
                aria-label={`Go to page ${i + 1}`}
                onClick={() => {
                  setPlayingId(null);
                  setPage(i);
                }}
                className={`h-2 rounded-full transition-all ${
                  i === page ? "w-5 bg-brand" : "w-2 bg-line"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

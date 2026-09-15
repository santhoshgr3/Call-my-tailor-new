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

export function VideoTestimonials({ items }: { items: VideoTestimonial[] }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const videos = useMemo(
    () => items.map((t) => ({ ...t, videoId: toVideoId(t.videoUrl) })),
    [items],
  );
  const current = videos[index];

  function go(dir: -1 | 1) {
    setPlaying(false);
    setIndex((i) => (i + dir + videos.length) % videos.length);
  }

  if (!current) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative overflow-hidden rounded-lg border border-line bg-black shadow-card">
        <div className="relative aspect-video w-full">
          {playing ? (
            <iframe
              key={current.videoId}
              src={`https://www.youtube.com/embed/${current.videoId}?autoplay=1&rel=0`}
              title={current.name}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group relative block h-full w-full"
              aria-label={`Play video: ${current.name}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://img.youtube.com/vi/${current.videoId}/hqdefault.jpg`}
                alt={current.name}
                className="h-full w-full object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-brand text-2xl text-white shadow-lg transition-transform group-hover:scale-110">
                  ▶
                </span>
              </span>
            </button>
          )}
        </div>

        {videos.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous video"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-lg text-brand-dark hover:bg-white"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next video"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-lg text-brand-dark hover:bg-white"
            >
              ›
            </button>
          </>
        )}
      </div>

      <div className="mt-3 text-center">
        <p className="font-bold text-brand-dark">{current.name}</p>
        {current.role && <p className="text-xs text-faint">{current.role}</p>}
      </div>

      {videos.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {videos.map((v, i) => (
            <button
              key={v.id}
              aria-label={`Go to video ${i + 1}`}
              onClick={() => {
                setPlaying(false);
                setIndex(i);
              }}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-5 bg-brand" : "w-2 bg-line"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

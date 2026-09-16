"use client";

import { useEffect, useState } from "react";

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
  const videos = items.map((t) => ({ ...t, videoId: toVideoId(t.videoUrl) }));
  const n = videos.length;
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (n <= 1) return;
    const t = setInterval(() => {
      setPlaying(false);
      setActive((v) => (v + 1) % n);
    }, 4500);
    return () => clearInterval(t);
  }, [n]);

  if (n === 0) return null;

  function go(idx: number) {
    setPlaying(false);
    setActive(((idx % n) + n) % n);
  }

  const prev = videos[(active - 1 + n) % n];
  const cur = videos[active];
  const next = videos[(active + 1) % n];

  function Side({ v, onClick }: { v: (typeof videos)[number]; onClick: () => void }) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`Show video: ${v.name}`}
        className="relative hidden aspect-[9/13] w-[26%] shrink-0 overflow-hidden rounded-xl sm:block"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`}
          alt={v.name}
          className="h-full w-full object-cover"
        />
        <span className="absolute inset-0 grid place-items-center bg-white/40">
          <span className="h-9 w-9 rounded-full bg-white/70" />
        </span>
      </button>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl items-center justify-center gap-3">
      <Side v={prev} onClick={() => go(active - 1)} />

      <div className="w-[92%] shrink-0 sm:w-[42%]">
        <div className="relative aspect-[9/13] overflow-hidden rounded-xl border border-line bg-black shadow-pop">
          {playing ? (
            <iframe
              src={`https://www.youtube.com/embed/${cur.videoId}?autoplay=1&rel=0`}
              title={cur.name}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group relative block h-full w-full"
              aria-label={`Play video: ${cur.name}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://img.youtube.com/vi/${cur.videoId}/hqdefault.jpg`}
                alt={cur.name}
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
          <p className="relative truncate text-sm font-bold text-brand-dark">{cur.name}</p>
        </div>
      </div>

      <Side v={next} onClick={() => go(active + 1)} />
    </div>
  );
}

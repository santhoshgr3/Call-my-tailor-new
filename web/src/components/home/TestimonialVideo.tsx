"use client";

import { useState } from "react";

/** YouTube thumbnail that turns into the player when tapped (keeps the page light until then). */
export function TestimonialVideo({ id, title, vertical }: { id: string; title: string; vertical?: boolean }) {
  const [play, setPlay] = useState(false);
  const ratio = vertical ? "aspect-[9/16] max-h-[420px]" : "aspect-video";
  if (play) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className={`w-full rounded-md bg-black ${ratio}`}
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setPlay(true)}
      aria-label={`Play video: ${title}`}
      className={`group relative block w-full overflow-hidden rounded-md bg-black ${ratio}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
      />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-brand text-xl text-white shadow-lg transition-transform group-hover:scale-110">
          ▶
        </span>
      </span>
    </button>
  );
}

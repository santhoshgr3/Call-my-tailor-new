"use client";

import { useState } from "react";

export function ProductGallery({
  images,
  name,
}: {
  images: { url: string; alt: string | null }[];
  name: string;
}) {
  const list = images.length ? images : [{ url: "/img/placeholder.svg", alt: name }];
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto sm:flex-col sm:overflow-y-auto no-scrollbar">
          {list.map((im, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-16 w-14 shrink-0 overflow-hidden border ${
                i === active ? "border-brand" : "border-line"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={im.url} alt={im.alt || ""} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="flex-1 border border-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={list[active].url}
          alt={list[active].alt || name}
          className="w-full object-cover"
        />
      </div>
    </div>
  );
}

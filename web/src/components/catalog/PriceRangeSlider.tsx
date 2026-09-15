"use client";

import { useState } from "react";

export function PriceRangeSlider({
  min,
  max,
  low,
  high,
}: {
  min: number;
  max: number;
  low: number;
  high: number;
}) {
  const [lo, setLo] = useState(low);
  const [hi, setHi] = useState(high);
  const span = Math.max(1, max - min);
  const leftPct = ((lo - min) / span) * 100;
  const rightPct = ((hi - min) / span) * 100;

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="flex flex-1 items-center border border-line px-2 py-1">
          <span className="mr-1 text-xs text-faint">₹</span>
          <input
            type="number"
            name="min"
            value={lo}
            onChange={(e) => setLo(Math.min(Number(e.target.value) || min, hi))}
            className="w-full text-sm outline-none"
          />
        </span>
        <span>–</span>
        <span className="flex flex-1 items-center border border-line px-2 py-1">
          <span className="mr-1 text-xs text-faint">₹</span>
          <input
            type="number"
            name="max"
            value={hi}
            onChange={(e) => setHi(Math.max(Number(e.target.value) || max, lo))}
            className="w-full text-sm outline-none"
          />
        </span>
      </div>

      <div className="relative mt-4 h-1.5">
        <div className="absolute inset-0 rounded-full bg-line" />
        <div
          className="absolute h-full rounded-full bg-brand"
          style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={lo}
          onChange={(e) => setLo(Math.min(Number(e.target.value), hi))}
          className="range-thumb pointer-events-none absolute inset-0 h-1.5 w-full appearance-none bg-transparent"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={hi}
          onChange={(e) => setHi(Math.max(Number(e.target.value), lo))}
          className="range-thumb pointer-events-none absolute inset-0 h-1.5 w-full appearance-none bg-transparent"
        />
      </div>
    </div>
  );
}

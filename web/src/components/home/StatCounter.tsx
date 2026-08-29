"use client";

import { useEffect, useRef, useState } from "react";

export function StatCounter({ value, label }: { value: string; label: string }) {
  const target = parseInt(String(value).replace(/[^\d]/g, ""), 10) || 0;
  const [n, setN] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !started.current) {
        started.current = true;
        const dur = 1600;
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / dur);
          setN(Math.floor(p * target));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl font-extrabold text-brand md:text-4xl">
        {n.toLocaleString("en-IN")}
        <span className="text-brand">+</span>
      </div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/70">
        {label}
      </div>
    </div>
  );
}

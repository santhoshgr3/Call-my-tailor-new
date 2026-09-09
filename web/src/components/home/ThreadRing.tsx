/**
 * Decorative "tailor thread" overlay for the Order-by-Category tiles, matching
 * callmytailor.com: a thin dashed red circle inscribed in the square photo, with
 * a black needle passing through the lower-right and a small curl of red thread.
 */
export function ThreadRing({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden
    >
      {/* dashed red ring */}
      <circle
        cx="60"
        cy="60"
        r="57"
        fill="none"
        stroke="#eb3740"
        strokeWidth="1.6"
        strokeDasharray="5 4"
        strokeLinecap="round"
      />
      {/* needle — a fine black line crossing the lower-right and running off the tile */}
      <g stroke="#111" strokeLinecap="round">
        <path d="M84 74 L120 120" strokeWidth="2.2" />
      </g>
      <ellipse
        cx="85.5"
        cy="76"
        rx="1.6"
        ry="3"
        fill="none"
        stroke="#111"
        strokeWidth="1.3"
        transform="rotate(38 85.5 76)"
      />
      {/* thread curl */}
      <path
        d="M116 116 c 6 -4 6 -14 -3 -16 c -9 -2 -14 8 -7 14 c 5 4 13 2 15 -6"
        fill="none"
        stroke="#eb3740"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

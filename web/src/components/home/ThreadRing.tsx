/**
 * Decorative "tailor thread" overlay for the Order-by-Category tiles, matching
 * callmytailor.com: a thin dashed red circle over the photo, with a fine black
 * needle at the lower right and a small curl of red thread.
 */
export function ThreadRing({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden
    >
      <circle
        cx="60"
        cy="60"
        r="55"
        fill="none"
        stroke="#eb3740"
        strokeWidth="1.4"
        strokeDasharray="5 4"
      />
      {/* needle */}
      <line x1="86" y1="80" x2="108" y2="108" stroke="#111" strokeWidth="1.8" strokeLinecap="round" />
      {/* thread curl */}
      <path
        d="M104 106c5-3 4-11-3-12s-11 6-5 11c4 3 10 1 11-5"
        fill="none"
        stroke="#eb3740"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

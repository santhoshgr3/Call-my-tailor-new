/**
 * Decorative red "tailor thread" ring drawn around the category circles on the
 * Order-by-Category row, mimicking callmytailor.com: a broken red circle plus a
 * needle and a curl of thread at the lower-right.
 */
export function ThreadRing({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden
    >
      {/* broken outer ring */}
      <circle
        cx="60"
        cy="60"
        r="56"
        fill="none"
        stroke="#eb3740"
        strokeWidth="2"
        strokeDasharray="46 10 60 12 30 14"
        strokeLinecap="round"
      />
      {/* needle */}
      <g stroke="#1c1c1c" strokeWidth="2.4" strokeLinecap="round">
        <path d="M96 78 L114 112" />
      </g>
      <circle cx="97.5" cy="80" r="2.1" fill="none" stroke="#1c1c1c" strokeWidth="1.6" />
      {/* thread curl */}
      <path
        d="M112 110 c 6 -6 2 -16 -6 -16 c -8 0 -12 10 -4 15 c 6 4 14 0 14 -8"
        fill="none"
        stroke="#eb3740"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

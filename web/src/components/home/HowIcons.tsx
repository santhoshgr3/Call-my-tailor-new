/** Red flat pictograms for the "How It Work" steps, matching callmytailor.com. */
export function HowIcon({ step, className = "h-12 w-12" }: { step: number; className?: string }) {
  const cls = `${className} text-brand`;
  switch (step) {
    /* 1 — SELECT YOUR PRODUCT / UPLOAD YOUR DESIGN  (monitor + shirt + list) */
    case 1:
      return (
        <svg viewBox="0 0 64 64" className={cls} fill="currentColor" aria-hidden>
          <path d="M5 8h54a3 3 0 0 1 3 3v32a3 3 0 0 1-3 3H37v5h8a2.5 2.5 0 0 1 0 5H19a2.5 2.5 0 0 1 0-5h8v-5H5a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3Zm2 6v26h50V14H7Z" />
          {/* shirt */}
          <path d="M18 17l4-2 4 4 4-4 4 2 3 4-3 3-2-2v11H20V22l-2 2-3-3 3-4Z" />
          {/* list lines */}
          <path d="M40 19h13v3H40zM40 26h13v3H40zM40 33h9v3h-9z" />
        </svg>
      );
    /* 2 — BOOK YOUR HOME VISIT / AND PLACE YOUR ORDER  (house + person) */
    case 2:
      return (
        <svg viewBox="0 0 64 64" className={cls} fill="currentColor" aria-hidden>
          <path d="M32 5 3 27l3 4 5-4v33h42V27l5 4 3-4L32 5Zm0 7.5L47 24v31H17V24l15-11.5Z" />
          {/* person */}
          <circle cx="30" cy="30" r="4.5" />
          <path d="M22 55v-8a6 6 0 0 1 6-6h3a6 6 0 0 1 6 6v8h-4V45h-1.5v10h-4V45H32v10h-4Z" />
          {/* briefcase */}
          <path d="M39 40h8v3h-8zM38 44h10v9H38z" />
          <path d="M42 39h2v2h-2z" />
        </svg>
      );
    /* 3 — GET MEASURED AT HOME / AND CHOOSE YOUR FABRICS  (rolled measuring tape) */
    case 3:
      return (
        <svg viewBox="0 0 64 64" className={cls} aria-hidden>
          <path
            d="M40 12a20 20 0 1 0 4 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <circle cx="24" cy="24" r="6" fill="none" stroke="currentColor" strokeWidth="7" />
          {/* tape tail with ticks */}
          <path
            d="M39 25c8 2 14 8 16 17l-9 3c-2-6-6-10-12-12"
            fill="currentColor"
          />
          <g stroke="#fff" strokeWidth="2">
            <path d="M43 30v4M48 33v4M52 38v4" />
          </g>
        </svg>
      );
    /* 4 — GET DELIVERED AT HOME / AFTER GETTING TRIAL  (delivery truck + clock) */
    default:
      return (
        <svg viewBox="0 0 64 64" className={cls} fill="currentColor" aria-hidden>
          {/* box body */}
          <rect x="3" y="24" width="33" height="22" rx="2" />
          {/* cab */}
          <path d="M36 30h9l9 9v7H36z" />
          {/* wheels */}
          <circle cx="16" cy="49" r="5.5" />
          <circle cx="45" cy="49" r="5.5" />
          <circle cx="16" cy="49" r="2" fill="#fff" />
          <circle cx="45" cy="49" r="2" fill="#fff" />
          {/* clock */}
          <circle cx="19" cy="16" r="12" />
          <circle cx="19" cy="16" r="9" fill="#fff" />
          <path
            d="M19 9v7l5 3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

export function StepArrow() {
  return (
    <svg
      viewBox="0 0 44 24"
      className="hidden h-4 w-10 shrink-0 text-[#9a9a9a] md:block"
      fill="currentColor"
      aria-hidden
    >
      <path d="M0 9h26V3l12 9-12 9v-6H0z" />
    </svg>
  );
}

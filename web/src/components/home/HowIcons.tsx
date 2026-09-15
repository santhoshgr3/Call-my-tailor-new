/** Red flat pictograms for the "How It Work" steps — bold, simple shapes for clarity at small sizes. */
export function HowIcon({ step, className = "h-12 w-12" }: { step: number; className?: string }) {
  const cls = `${className} text-brand`;
  switch (step) {
    /* 1 — SELECT YOUR PRODUCT / UPLOAD YOUR DESIGN  (monitor + shirt) */
    case 1:
      return (
        <svg viewBox="0 0 64 64" className={cls} fill="none" aria-hidden>
          <rect x="4" y="8" width="56" height="36" rx="3" fill="currentColor" />
          <rect x="10" y="14" width="44" height="24" rx="1.5" fill="#fff" />
          <path d="M27 44h10v6h-10z" fill="currentColor" />
          <rect x="18" y="50" width="28" height="5" rx="2.5" fill="currentColor" />
          {/* shirt, centred on the white screen */}
          <path
            d="M32 18l6 4-3 4v9H29v-9l-3-4 6-4z"
            fill="currentColor"
          />
        </svg>
      );
    /* 2 — BOOK YOUR HOME VISIT / AND PLACE YOUR ORDER  (house + person) */
    case 2:
      return (
        <svg viewBox="0 0 64 64" className={cls} fill="currentColor" aria-hidden>
          <path d="M32 4 2 28h8v30h44V28h8L32 4Z" />
          <path d="M18 58V30l14-11 14 11v28H18Z" fill="#fff" />
          <circle cx="32" cy="38" r="6" />
          <path d="M22 58v-6a10 10 0 0 1 20 0v6H22Z" />
        </svg>
      );
    /* 3 — GET MEASURED AT HOME / AND CHOOSE YOUR FABRICS  (retractable tape measure) */
    case 3:
      return (
        <svg viewBox="0 0 64 64" className={cls} fill="currentColor" aria-hidden>
          {/* case */}
          <rect x="4" y="16" width="34" height="34" rx="8" />
          <circle cx="21" cy="33" r="8" fill="#fff" />
          <circle cx="21" cy="33" r="3" />
          {/* tape tongue with tick marks, extending out */}
          <path d="M34 22h22a4 4 0 0 1 4 4v3a4 4 0 0 1-4 4H34z" fill="#fff" stroke="currentColor" strokeWidth="2" />
          <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M42 24v7M49 24v7M56 24v7" />
          </g>
        </svg>
      );
    /* 4 — GET DELIVERED AT HOME / AFTER GETTING TRIAL  (delivery truck + clock) */
    default:
      return (
        <svg viewBox="0 0 64 64" className={cls} fill="currentColor" aria-hidden>
          <rect x="2" y="26" width="34" height="20" rx="2" />
          <path d="M36 31h11l11 10v5H36z" />
          <rect x="41" y="36" width="10" height="7" fill="#fff" />
          <circle cx="17" cy="49" r="6" />
          <circle cx="47" cy="49" r="6" />
          <circle cx="17" cy="49" r="2.2" fill="#fff" />
          <circle cx="47" cy="49" r="2.2" fill="#fff" />
          <circle cx="20" cy="15" r="13" />
          <circle cx="20" cy="15" r="10" fill="#fff" />
          <path
            d="M20 8v7l5 4"
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

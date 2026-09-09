/** Red flat pictograms for the "How It Work" steps, matching the original site. */
export function HowIcon({ step, className = "h-12 w-12" }: { step: number; className?: string }) {
  const common = `${className} text-brand`;
  switch (step) {
    // 1 — select your product / upload your design  (monitor + shirt + list)
    case 1:
      return (
        <svg viewBox="0 0 64 64" className={common} fill="currentColor" aria-hidden>
          <path d="M6 8h52a3 3 0 0 1 3 3v30a3 3 0 0 1-3 3H35v6h9a2 2 0 0 1 0 4H20a2 2 0 0 1 0-4h9v-6H6a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3Zm2 5v26h48V13H8Z" />
          <path d="M20 18l4-3 4 3 4-3v13l-4-2-4 2-4-2-4 2V18l4 0Zm-3 3v5l3-1 4 2 4-2 3 1v-5l-3 2-4-2-4 2-3-2Z" />
          <path d="M36 19h14v3H36zM36 25h14v3H36zM36 31h10v3H36z" />
        </svg>
      );
    // 2 — book your home visit  (house + person with briefcase)
    case 2:
      return (
        <svg viewBox="0 0 64 64" className={common} fill="currentColor" aria-hidden>
          <path d="M32 6 4 28h6v28h44V28h6L32 6Zm0 6.4L48 25v27H16V25l16-12.6Z" />
          <circle cx="30" cy="33" r="5" />
          <path d="M22 52v-7a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v7h-4v-6h-2v6h-4v-6h-2v6h-4Z" />
          <path d="M39 40h7v3h-7zM39 45h7v7h-7z" />
        </svg>
      );
    // 3 — get measured at home  (rolled measuring tape)
    case 3:
      return (
        <svg viewBox="0 0 64 64" className={common} fill="currentColor" aria-hidden>
          <path d="M26 6C14 6 4 15 4 27c0 9 6 16 15 19l4-9c-5-1-9-5-9-10 0-6 5-11 12-11s12 5 12 11c0 3-1 5-3 7l6 7c4-4 6-9 6-15C47 15 38 6 26 6Z" />
          <circle cx="26" cy="27" r="5" fill="#fff" />
          <path d="M19 46c3 8 11 12 20 12 8 0 14-3 18-9l-6-5c-3 4-7 6-12 6-5 0-9-2-12-6l-8 2Z" />
          <path d="M24 40h2v4h-2zM30 42h2v4h-2zM36 42h2v4h-2zM42 40h2v4h-2z" fill="#fff" />
        </svg>
      );
    // 4 — get delivered at home  (delivery truck + clock)
    default:
      return (
        <svg viewBox="0 0 64 64" className={common} fill="currentColor" aria-hidden>
          <path d="M4 20h30v24H4zM34 28h12l8 8v8H34z" />
          <circle cx="16" cy="48" r="5" />
          <circle cx="44" cy="48" r="5" />
          <circle cx="20" cy="16" r="12" />
          <path d="M20 9v7l5 3" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      );
  }
}

export function StepArrow() {
  return (
    <svg viewBox="0 0 40 24" className="hidden h-5 w-9 shrink-0 text-faint md:block" aria-hidden>
      <path
        d="M2 12h30m0 0-8-7m8 7-8 7"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

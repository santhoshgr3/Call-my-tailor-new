/** Shopping-bag icon used for every "cart" button (follows the text colour). */
export function BagIcon({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M12 2.5a4.2 4.2 0 00-4.2 4.2v.5H5.1a.7.7 0 00-.7.7l-.6 12.6a.7.7 0 00.7.7h15a.7.7 0 00.7-.7l-.6-12.6a.7.7 0 00-.7-.7h-2.7v-.5A4.2 4.2 0 0012 2.5zm0 1.9a2.3 2.3 0 012.3 2.3v.5H9.7v-.5A2.3 2.3 0 0112 4.4zM9 9.6a1 1 0 110 2 1 1 0 010-2zm6 0a1 1 0 110 2 1 1 0 010-2z"
      />
    </svg>
  );
}

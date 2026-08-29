export function Stars({ value = 0, count }: { value?: number; count?: number }) {
  const full = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1 text-[13px] leading-none">
      <span aria-hidden className="tracking-tight">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={i <= full ? "text-amber-400" : "text-line"}>
            ★
          </span>
        ))}
      </span>
      {typeof count === "number" && <span className="text-faint text-xs">({count})</span>}
    </span>
  );
}

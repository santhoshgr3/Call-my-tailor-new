"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const OPTIONS: { value: string; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "name-asc", label: "Name (A - Z)" },
  { value: "name-desc", label: "Name (Z - A)" },
  { value: "price-asc", label: "Price (Low > High)" },
  { value: "price-desc", label: "Price (High > Low)" },
  { value: "rating-desc", label: "Rating (Highest)" },
];

export function SortSelect({ sort, perPage }: { sort: string; perPage: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    next.set(key, value);
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-4 text-xs">
      <label className="flex items-center gap-2">
        <span className="font-semibold uppercase text-faint">Sort By:</span>
        <select
          value={sort}
          onChange={(e) => update("sort", e.target.value)}
          className="border border-line bg-white px-2 py-1.5 outline-none"
        >
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2">
        <span className="font-semibold uppercase text-faint">Show:</span>
        <select
          value={String(perPage)}
          onChange={(e) => update("show", e.target.value)}
          className="border border-line bg-white px-2 py-1.5 outline-none"
        >
          {[15, 25, 50, 75, 100].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

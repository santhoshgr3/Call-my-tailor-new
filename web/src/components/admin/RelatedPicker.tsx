"use client";

import { useEffect, useRef, useState } from "react";

type P = { id: string; name: string; sku: string | null; isActive: boolean; image: string };

/** Search products and pick the ones to show as "related" — chips can be removed or re-ordered. */
export function RelatedPicker({
  selectedIds,
  onChange,
  excludeId,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  excludeId?: string;
}) {
  const [known, setKnown] = useState<Record<string, P>>({});
  const [q, setQ] = useState("");
  const [results, setResults] = useState<P[]>([]);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // load names/images for the products already selected
  useEffect(() => {
    const missing = selectedIds.filter((id) => !known[id]);
    if (!missing.length) return;
    fetch(`/api/admin/products/search?ids=${missing.join(",")}`)
      .then((r) => r.json())
      .then((d) => {
        const next: Record<string, P> = {};
        for (const p of (d.products ?? []) as P[]) next[p.id] = p;
        setKnown((k) => ({ ...k, ...next }));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds]);

  function search(text: string) {
    setQ(text);
    if (timer.current) clearTimeout(timer.current);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setBusy(true);
      try {
        const d = await fetch(`/api/admin/products/search?q=${encodeURIComponent(text.trim())}`).then((r) => r.json());
        const list = ((d.products ?? []) as P[]).filter((p) => p.id !== excludeId);
        setKnown((k) => ({ ...k, ...Object.fromEntries(list.map((p) => [p.id, p])) }));
        setResults(list);
      } finally {
        setBusy(false);
      }
    }, 250);
  }

  const add = (id: string) => {
    if (!selectedIds.includes(id) && selectedIds.length < 20) onChange([...selectedIds, id]);
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= selectedIds.length) return;
    const c = [...selectedIds];
    [c[i], c[j]] = [c[j], c[i]];
    onChange(c);
  };

  return (
    <div className="space-y-3">
      {selectedIds.length > 0 && (
        <ul className="space-y-1.5">
          {selectedIds.map((id, i) => {
            const p = known[id];
            return (
              <li key={id} className="flex items-center gap-2 rounded border border-line bg-soft p-1.5 text-sm">
                {p?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" className="h-10 w-8 shrink-0 rounded object-cover" />
                ) : (
                  <span className="h-10 w-8 shrink-0 rounded bg-line" />
                )}
                <span className="min-w-0 flex-1 truncate">{p?.name ?? "Loading…"}</span>
                <button type="button" onClick={() => move(i, -1)} className="px-1 text-faint hover:text-brand" aria-label="Move up">
                  ↑
                </button>
                <button type="button" onClick={() => move(i, 1)} className="px-1 text-faint hover:text-brand" aria-label="Move down">
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => onChange(selectedIds.filter((x) => x !== id))}
                  className="px-1 text-brand"
                  aria-label="Remove"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div>
        <input
          value={q}
          onChange={(e) => search(e.target.value)}
          placeholder="Search products by name or SKU to add…"
          className="w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-brand"
        />
        {busy && <p className="mt-1 text-xs text-faint">Searching…</p>}
        {results.length > 0 && (
          <ul className="mt-2 max-h-64 divide-y divide-line overflow-y-auto rounded border border-line bg-white text-sm">
            {results.map((p) => {
              const on = selectedIds.includes(p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={on}
                    onClick={() => add(p.id)}
                    className="flex w-full items-center gap-2 p-1.5 text-left hover:bg-soft disabled:opacity-50"
                  >
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt="" className="h-10 w-8 shrink-0 rounded object-cover" />
                    ) : (
                      <span className="h-10 w-8 shrink-0 rounded bg-line" />
                    )}
                    <span className="min-w-0 flex-1 truncate">
                      {p.name}
                      {p.sku && <span className="ml-2 text-xs text-faint">{p.sku}</span>}
                    </span>
                    <span className="text-xs font-semibold text-brand">{on ? "Added" : "+ Add"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <p className="text-[11px] text-faint">{selectedIds.length}/20 chosen</p>
    </div>
  );
}

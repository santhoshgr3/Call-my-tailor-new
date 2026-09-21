"use client";

import { useState } from "react";

export function SelectAll() {
  return (
    <input
      type="checkbox"
      aria-label="Select all on this page"
      className="h-4 w-4"
      onChange={(e) => {
        document
          .querySelectorAll<HTMLInputElement>('input[name="ids"][form="bulk-form"]')
          .forEach((c) => (c.checked = e.target.checked));
      }}
    />
  );
}

const ACTIONS: { value: string; label: string }[] = [
  { value: "activate", label: "Set active" },
  { value: "deactivate", label: "Set inactive (hide)" },
  { value: "feature_on", label: "Mark featured" },
  { value: "feature_off", label: "Remove featured" },
  { value: "best_on", label: "Mark best seller" },
  { value: "best_off", label: "Remove best seller" },
  { value: "new_on", label: "Mark new arrival" },
  { value: "new_off", label: "Remove new arrival" },
  { value: "trend_on", label: "Mark trending" },
  { value: "trend_off", label: "Remove trending" },
  { value: "category_add", label: "Add to category…" },
  { value: "category_remove", label: "Remove from category…" },
  { value: "price_pct", label: "Change price by % …" },
  { value: "price_add", label: "Change price by ₹ amount …" },
  { value: "delete", label: "Delete selected" },
];

export function ProductBulkBar({
  action,
  categories,
}: {
  action: (fd: FormData) => Promise<void>;
  categories: { slug: string; name: string }[];
}) {
  const [act, setAct] = useState("");
  const needsCat = act === "category_add" || act === "category_remove";
  const needsAmount = act === "price_pct" || act === "price_add";

  return (
    <form
      id="bulk-form"
      action={action}
      onSubmit={(e) => {
        const n = document.querySelectorAll('input[name="ids"][form="bulk-form"]:checked').length;
        if (!n) {
          e.preventDefault();
          alert("Tick at least one product first.");
          return;
        }
        if (!act) {
          e.preventDefault();
          alert("Choose an action.");
          return;
        }
        if (act === "delete" && !confirm(`Permanently delete ${n} product(s)? This cannot be undone.`)) {
          e.preventDefault();
        } else if (needsAmount && !confirm(`Change the price of ${n} product(s)?`)) {
          e.preventDefault();
        }
      }}
      className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-white p-3 text-sm"
    >
      <span className="text-xs font-bold uppercase text-faint">With selected:</span>
      <select
        name="bulk_action"
        value={act}
        onChange={(e) => setAct(e.target.value)}
        className="rounded border border-line px-2 py-1.5"
      >
        <option value="">Choose action…</option>
        {ACTIONS.map((a) => (
          <option key={a.value} value={a.value}>
            {a.label}
          </option>
        ))}
      </select>
      {needsCat && (
        <select name="category" className="rounded border border-line px-2 py-1.5" required>
          <option value="">Category…</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      )}
      {needsAmount && (
        <input
          name="amount"
          type="number"
          step="any"
          required
          placeholder={act === "price_pct" ? "e.g. 10 or -5 (%)" : "e.g. 500 or -200 (₹)"}
          className="w-44 rounded border border-line px-2 py-1.5"
        />
      )}
      <button className={act === "delete" ? "btn-dark !py-1.5 !text-[11px]" : "btn-brand !py-1.5 !text-[11px]"}>
        Apply
      </button>
    </form>
  );
}

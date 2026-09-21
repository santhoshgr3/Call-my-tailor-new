"use client";

import { useState } from "react";
import { ImageField } from "./ImageField";

export type RepeaterField = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "image" | "number" | "list";
  placeholder?: string;
  /** for type "list": the sub-fields of each nested row */
  fields?: RepeaterField[];
  addLabel?: string;
};

type Row = Record<string, unknown>;

const inputCls =
  "w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-brand";

function blank(fields: RepeaterField[]): Row {
  const r: Row = {};
  for (const f of fields) r[f.key] = f.type === "list" ? [] : f.type === "number" ? 0 : "";
  return r;
}

function List({
  fields,
  rows,
  onChange,
  addLabel,
  nested,
}: {
  fields: RepeaterField[];
  rows: Row[];
  onChange: (rows: Row[]) => void;
  addLabel: string;
  nested?: boolean;
}) {
  const update = (i: number, key: string, v: unknown) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const c = [...rows];
    [c[i], c[j]] = [c[j], c[i]];
    onChange(c);
  };

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div
          key={i}
          className={`rounded border border-line p-3 ${nested ? "bg-white" : "bg-soft"}`}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {fields.map((f) => {
              const full = f.type === "list" || f.type === "textarea" || f.type === "image";
              return (
                <div key={f.key} className={full ? "sm:col-span-2" : ""}>
                  <span className="mb-1 block text-[11px] font-bold uppercase text-faint">
                    {f.label}
                  </span>
                  {f.type === "image" ? (
                    <ImageField
                      value={String(row[f.key] ?? "")}
                      onChange={(v) => update(i, f.key, v)}
                      placeholder={f.placeholder}
                      compact
                    />
                  ) : f.type === "textarea" ? (
                    <textarea
                      rows={2}
                      value={String(row[f.key] ?? "")}
                      onChange={(e) => update(i, f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className={inputCls}
                    />
                  ) : f.type === "list" ? (
                    <List
                      fields={f.fields ?? []}
                      rows={(row[f.key] as Row[]) ?? []}
                      onChange={(v) => update(i, f.key, v)}
                      addLabel={f.addLabel ?? "Add"}
                      nested
                    />
                  ) : (
                    <input
                      type={f.type === "number" ? "number" : "text"}
                      value={String(row[f.key] ?? "")}
                      onChange={(e) =>
                        update(i, f.key, f.type === "number" ? Number(e.target.value) : e.target.value)
                      }
                      placeholder={f.placeholder}
                      className={inputCls}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-faint">
            <button type="button" onClick={() => move(i, -1)} className="hover:text-brand">
              ↑ Up
            </button>
            <button type="button" onClick={() => move(i, 1)} className="hover:text-brand">
              ↓ Down
            </button>
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
              className="ml-auto hover:text-brand"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...rows, blank(fields)])}
        className="rounded border border-dashed border-line px-3 py-1.5 text-xs font-semibold text-muted hover:border-brand hover:text-brand"
      >
        + {addLabel}
      </button>
    </div>
  );
}

/** Editable list of structured rows; serialises to a hidden JSON input named `name`. */
export function Repeater({
  name,
  initial,
  fields,
  addLabel = "Add item",
}: {
  name: string;
  initial: Row[];
  fields: RepeaterField[];
  addLabel?: string;
}) {
  const [rows, setRows] = useState<Row[]>(initial ?? []);
  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      <List fields={fields} rows={rows} onChange={setRows} addLabel={addLabel} />
    </div>
  );
}

/** Editable list of plain strings (one input per row). */
export function StringList({
  name,
  initial,
  addLabel = "Add",
  placeholder,
}: {
  name: string;
  initial: string[];
  addLabel?: string;
  placeholder?: string;
}) {
  const [items, setItems] = useState<string[]>(initial ?? []);
  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={JSON.stringify(items.filter((s) => s.trim()))} />
      {items.map((s, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={s}
            placeholder={placeholder}
            onChange={(e) => setItems(items.map((x, idx) => (idx === i ? e.target.value : x)))}
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => setItems(items.filter((_, idx) => idx !== i))}
            className="px-2 text-faint hover:text-brand"
            aria-label="Remove"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setItems([...items, ""])}
        className="rounded border border-dashed border-line px-3 py-1.5 text-xs font-semibold text-muted hover:border-brand hover:text-brand"
      >
        + {addLabel}
      </button>
    </div>
  );
}

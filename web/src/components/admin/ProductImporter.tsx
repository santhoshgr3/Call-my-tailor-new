"use client";

import { useState } from "react";
import Link from "next/link";
import { importChunk } from "@/app/admin/products/import/actions";

type Row = {
  row: number;
  action: "create" | "update" | "skip" | "error";
  name: string;
  slug: string;
  sku: string;
  price: number | null;
  fields: string[];
  errors: string[];
  warnings: string[];
};
type Rec = { row: number; cells: Record<string, string>; specs: Record<string, string> };
type Opts = { mode: "create" | "update" | "upsert"; createCategories: boolean; defaultOptions: boolean };
type Preview = {
  summary: { total: number; create: number; update: number; skip: number; error: number };
  rows: Row[];
  records: Rec[];
  unknownHeaders: string[];
  opts: Opts;
};

const BADGE: Record<Row["action"], string> = {
  create: "bg-green-100 text-green-700",
  update: "bg-blue-100 text-blue-700",
  skip: "bg-gray-100 text-gray-600",
  error: "bg-red-100 text-red-700",
};

export function ProductImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Opts["mode"]>("upsert");
  const [createCategories, setCreateCategories] = useState(false);
  const [defaultOptions, setDefaultOptions] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [filter, setFilter] = useState<"all" | Row["action"]>("all");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [results, setResults] = useState<Row[] | null>(null);

  async function readFile() {
    if (!file) return;
    setBusy(true);
    setError("");
    setPreview(null);
    setResults(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("mode", mode);
      fd.append("createCategories", createCategories ? "1" : "0");
      fd.append("defaultOptions", defaultOptions ? "1" : "0");
      const res = await fetch("/api/admin/products/import", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not read that file.");
      setPreview(data as Preview);
      setFilter("all");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that file.");
    } finally {
      setBusy(false);
    }
  }

  async function runImport() {
    if (!preview) return;
    const todo = preview.records.filter((r) => {
      const row = preview.rows.find((x) => x.row === r.row);
      return row && (row.action === "create" || row.action === "update");
    });
    if (!todo.length) return;
    setBusy(true);
    setError("");
    setProgress({ done: 0, total: todo.length });
    const all: Row[] = [];
    try {
      const SIZE = 20;
      for (let i = 0; i < todo.length; i += SIZE) {
        const out = await importChunk(todo.slice(i, i + SIZE), preview.opts);
        all.push(...(out as Row[]));
        setProgress({ done: Math.min(todo.length, i + SIZE), total: todo.length });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "The import stopped unexpectedly. Rows already saved are kept.");
    } finally {
      setBusy(false);
      setResults(all);
      setPreview(null);
      setProgress(null);
    }
  }

  const reset = () => {
    setPreview(null);
    setResults(null);
    setFile(null);
    setError("");
  };

  /* ---------- results ---------- */
  if (results) {
    const created = results.filter((r) => r.action === "create").length;
    const updated = results.filter((r) => r.action === "update").length;
    const failed = results.filter((r) => r.action === "error");
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-green-200 bg-green-50 p-5">
          <p className="text-lg font-bold text-green-800">Import finished</p>
          <p className="mt-1 text-sm text-green-800">
            {created} product{created === 1 ? "" : "s"} created · {updated} updated
            {failed.length ? ` · ${failed.length} failed` : ""}
          </p>
        </div>
        {error && <p className="rounded border border-brand/40 bg-brand/5 p-3 text-sm text-brand">{error}</p>}
        {failed.length > 0 && (
          <div className="rounded-lg border border-line bg-white p-4">
            <p className="mb-2 text-sm font-bold">Rows that could not be saved</p>
            <ul className="space-y-1 text-sm">
              {failed.map((f) => (
                <li key={f.row}>
                  Row {f.row} {f.name && `(${f.name})`}: <span className="text-brand">{f.errors.join(" ")}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex gap-3">
          <Link href="/admin/products" className="btn-brand !py-2 !text-[11px]">
            View products
          </Link>
          <button onClick={reset} className="btn-outline !py-2 !text-[11px]">
            Import another file
          </button>
        </div>
      </div>
    );
  }

  /* ---------- preview ---------- */
  if (preview) {
    const s = preview.summary;
    const writable = s.create + s.update;
    const shown = preview.rows.filter((r) => filter === "all" || r.action === filter).slice(0, 300);
    const tab = (k: typeof filter, label: string, n: number) => (
      <button
        key={k}
        onClick={() => setFilter(k)}
        className={`rounded border px-3 py-1 text-xs font-semibold ${
          filter === k ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand"
        }`}
      >
        {label} ({n})
      </button>
    );
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="text-sm font-bold">Preview — nothing has been saved yet</p>
          <p className="mt-1 text-sm text-muted">
            {s.total} rows read: <b className="text-green-700">{s.create} to create</b>,{" "}
            <b className="text-blue-700">{s.update} to update</b>, {s.skip} skipped,{" "}
            <b className="text-red-700">{s.error} with errors</b>. Rows with errors are not imported.
          </p>
          {preview.unknownHeaders.length > 0 && (
            <p className="mt-2 text-xs text-amber-700">
              Ignored columns: {preview.unknownHeaders.join(", ")}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {tab("all", "All", s.total)}
          {tab("create", "Create", s.create)}
          {tab("update", "Update", s.update)}
          {tab("skip", "Skipped", s.skip)}
          {tab("error", "Errors", s.error)}
        </div>

        <div className="overflow-x-auto rounded-lg border border-line bg-white">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="bg-soft uppercase text-faint">
              <tr>
                <th className="px-3 py-2">Row</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.row} className="border-t border-line align-top">
                  <td className="px-3 py-2">{r.row}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded px-2 py-0.5 font-semibold capitalize ${BADGE[r.action]}`}>
                      {r.action}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-semibold">{r.name || "—"}</p>
                    <p className="text-faint">{r.slug}</p>
                  </td>
                  <td className="px-3 py-2">{r.sku || "—"}</td>
                  <td className="px-3 py-2">{r.price != null ? `₹${r.price.toLocaleString("en-IN")}` : "—"}</td>
                  <td className="px-3 py-2">
                    {r.errors.map((e, i) => (
                      <p key={i} className="text-red-600">{e}</p>
                    ))}
                    {r.warnings.map((w, i) => (
                      <p key={i} className="text-amber-700">{w}</p>
                    ))}
                    {r.action === "update" && (
                      <p className="text-faint">Changes: {r.fields.join(", ") || "nothing"}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {preview.rows.length > shown.length && (
          <p className="text-xs text-faint">Showing the first {shown.length} rows of this view.</p>
        )}

        {progress && (
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-line">
              <div
                className="h-full bg-brand transition-all"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-faint">
              Saving… {progress.done} of {progress.total}
            </p>
          </div>
        )}
        {error && <p className="rounded border border-brand/40 bg-brand/5 p-3 text-sm text-brand">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={runImport}
            disabled={busy || writable === 0}
            className="btn-brand !py-2.5 disabled:opacity-50"
          >
            {busy ? "Importing…" : `Import ${writable} product${writable === 1 ? "" : "s"}`}
          </button>
          <button onClick={reset} disabled={busy} className="btn-outline !py-2.5">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  /* ---------- upload ---------- */
  return (
    <div className="space-y-5">
      <label className="block cursor-pointer rounded-lg border-2 border-dashed border-line bg-soft p-8 text-center hover:border-brand">
        <input
          type="file"
          accept=".xlsx,.csv"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <p className="text-sm font-semibold">
          {file ? file.name : "Click to choose an Excel (.xlsx) or CSV file"}
        </p>
        <p className="mt-1 text-xs text-faint">
          {file ? `${(file.size / 1024).toFixed(0)} KB` : "Up to 4 MB and 5,000 rows per file"}
        </p>
      </label>

      <div>
        <p className="mb-2 text-xs font-bold uppercase text-faint">What should the import do?</p>
        <div className="space-y-2 text-sm">
          {(
            [
              ["upsert", "Create new products and update existing ones (recommended)"],
              ["create", "Only create new products — skip ones that already exist"],
              ["update", "Only update existing products — skip ones that don’t exist"],
            ] as const
          ).map(([v, label]) => (
            <label key={v} className="flex items-center gap-2">
              <input type="radio" name="mode" checked={mode === v} onChange={() => setMode(v)} />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={createCategories}
            onChange={(e) => setCreateCategories(e.target.checked)}
            className="h-4 w-4"
          />
          Create categories that don’t exist yet
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={defaultOptions}
            onChange={(e) => setDefaultOptions(e.target.checked)}
            className="h-4 w-4"
          />
          Give new products the default “Customization Method” options when the sheet has none
        </label>
      </div>

      {error && <p className="rounded border border-brand/40 bg-brand/5 p-3 text-sm text-brand">{error}</p>}

      <button onClick={readFile} disabled={!file || busy} className="btn-brand !py-2.5 disabled:opacity-50">
        {busy ? "Reading file…" : "Read file & preview"}
      </button>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { uploadImage } from "./ImageField";

type LibItem = { id: string; url: string; filename: string };

/**
 * Pick one or more images from the Media Library by clicking thumbnails —
 * no need to know or type file names. Files can also be uploaded from here.
 */
export function MediaPicker({
  initial = [],
  onClose,
  onConfirm,
}: {
  initial?: string[];
  onClose: () => void;
  onConfirm: (urls: string[]) => void;
}) {
  const [lib, setLib] = useState<LibItem[] | null>(null);
  const [folders, setFolders] = useState<string[]>([]);
  const [folder, setFolder] = useState<string | null>(null); // null = all images
  const [selected, setSelected] = useState<string[]>(initial);
  const [q, setQ] = useState("");
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  async function load(f: string | null = folder) {
    const res = await fetch(f === null ? "/api/admin/media" : `/api/admin/media?folder=${encodeURIComponent(f)}`);
    const data = await res.json().catch(() => ({ items: [], folders: [] }));
    setLib(data.items ?? []);
    setFolders(data.folders ?? []);
  }

  useEffect(() => {
    load(folder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setErr("");
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        try {
          urls.push(await uploadImage(f, folder ?? ""));
        } catch (e) {
          setErr(e instanceof Error ? e.message : "Upload failed");
        }
      }
      setSelected((s) => [...s, ...urls]);
      await load(folder);
    } finally {
      setUploading(false);
    }
  }

  const filtered = useMemo(() => {
    if (!lib) return [];
    const term = q.trim().toLowerCase();
    return term ? lib.filter((m) => m.filename.toLowerCase().includes(term)) : lib;
  }, [lib, q]);

  const toggle = (url: string) =>
    setSelected((s) => (s.includes(url) ? s.filter((u) => u !== url) : [...s, url]));

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line p-4">
          <h3 className="font-bold">Pick images from the Media Library</h3>
          <button type="button" onClick={onClose} className="text-xl leading-none text-faint hover:text-brand">
            ×
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by file name…"
            className="min-w-0 flex-1 rounded border border-line px-3 py-1.5 text-sm outline-none focus:border-brand"
          />
          <label className="cursor-pointer rounded border border-line bg-white px-2.5 py-1.5 text-xs font-semibold hover:border-brand hover:text-brand">
            {uploading ? "Uploading…" : "+ Upload"}
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              disabled={uploading}
              onChange={(e) => {
                onFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          <span className="text-xs text-faint">{selected.length} selected</span>
        </div>
        {folders.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-b border-line px-3 py-2">
            {[{ id: null as string | null, label: "All images" }, ...folders.map((f) => ({ id: f as string | null, label: "📁 " + f })), { id: "" as string | null, label: "No folder" }].map((t) => (
              <button
                key={String(t.id)}
                type="button"
                onClick={() => setFolder(t.id)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                  folder === t.id ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
        {err && <p className="px-3 pt-2 text-xs text-brand">{err}</p>}

        <div className="flex-1 overflow-y-auto p-3">
          {!lib ? (
            <p className="text-sm text-faint">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-faint">No images match — try Upload.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
              {filtered.map((m) => {
                const on = selected.includes(m.url);
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => toggle(m.url)}
                    title={m.filename}
                    className={`group relative overflow-hidden rounded border-2 ${
                      on ? "border-brand" : "border-transparent hover:border-line"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt={m.filename} className="aspect-square w-full bg-soft object-cover" />
                    <span
                      className={`absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold ${
                        on ? "bg-brand text-white" : "bg-white/80 text-transparent group-hover:text-faint"
                      }`}
                    >
                      ✓
                    </span>
                    <span className="block truncate bg-black/60 px-1 py-0.5 text-[10px] text-white">
                      {m.filename}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line p-3">
          <button type="button" onClick={() => setSelected([])} className="text-xs text-faint hover:text-brand">
            Clear selection
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-outline !py-1.5 !text-[11px]">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(selected)}
              className="btn-brand !py-1.5 !text-[11px]"
            >
              Use {selected.length} image{selected.length === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

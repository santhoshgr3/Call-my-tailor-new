"use client";

import { useState } from "react";

const inputCls =
  "w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-brand";

/** Downscale big images in the browser so uploads stay well under the 4MB request cap. */
async function prepare(file: File): Promise<File> {
  if (file.type === "image/gif" || file.type === "image/avif") return file;
  if (file.size < 1_200_000) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/webp", 0.85));
    if (blob && blob.size < file.size) {
      return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
    }
  } catch {
    /* fall through to the original file */
  }
  return file;
}

export async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", await prepare(file));
  const res = await fetch("/api/admin/upload", { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) throw new Error(data.error || "Upload failed");
  return data.url as string;
}

type LibItem = { id: string; url: string; filename: string };

/** URL input + upload button + media-library picker + live preview. Controlled when `value` is passed. */
export function ImageField({
  name,
  defaultValue = "",
  value,
  onChange,
  placeholder = "Image URL or upload",
  compact = false,
}: {
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  compact?: boolean;
}) {
  const controlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue);
  const val = controlled ? value : inner;
  const set = (v: string) => {
    if (!controlled) setInner(v);
    onChange?.(v);
  };
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [libOpen, setLibOpen] = useState(false);
  const [lib, setLib] = useState<LibItem[] | null>(null);

  async function onFile(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setBusy(true);
    setErr("");
    try {
      set(await uploadImage(f));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function openLib() {
    setLibOpen(true);
    if (lib) return;
    const res = await fetch("/api/admin/media");
    const data = await res.json().catch(() => ({ items: [] }));
    setLib(data.items ?? []);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        {val && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={val}
            alt=""
            className={`shrink-0 rounded border border-line bg-soft object-contain ${
              compact ? "h-9 w-9" : "h-16 w-16"
            }`}
          />
        )}
        <div className="min-w-0 flex-1 space-y-1.5">
          <input
            name={name}
            value={val}
            onChange={(e) => set(e.target.value)}
            placeholder={placeholder}
            className={inputCls}
          />
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <label className="cursor-pointer rounded border border-line bg-white px-2.5 py-1 font-semibold hover:border-brand hover:text-brand">
              {busy ? "Uploading…" : "Upload"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={busy}
                onChange={(e) => {
                  onFile(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              type="button"
              onClick={openLib}
              className="rounded border border-line bg-white px-2.5 py-1 font-semibold hover:border-brand hover:text-brand"
            >
              Library
            </button>
            {val && (
              <button type="button" onClick={() => set("")} className="text-faint hover:text-brand">
                Clear
              </button>
            )}
            {err && <span className="text-brand">{err}</span>}
          </div>
        </div>
      </div>

      {libOpen && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4"
          onClick={() => setLibOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold">Media library</h3>
              <button type="button" onClick={() => setLibOpen(false)} className="text-xl leading-none">
                ×
              </button>
            </div>
            {!lib ? (
              <p className="text-sm text-faint">Loading…</p>
            ) : lib.length === 0 ? (
              <p className="text-sm text-faint">No uploads yet — use the Upload button.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {lib.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => {
                      set(m.url);
                      setLibOpen(false);
                    }}
                    className="overflow-hidden rounded border border-line hover:border-brand"
                    title={m.filename}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt={m.filename} className="aspect-square w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

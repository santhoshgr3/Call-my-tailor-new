"use client";

import { useState, useTransition } from "react";
import { MediaPicker } from "./MediaPicker";
import { addGalleryItems } from "@/app/admin/gallery/actions";

/** Pick many photos from the Media Library and add them to the gallery under one category. */
export function GalleryAdder({ categories }: { categories: string[] }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          list="gallery-cats"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category for these photos (e.g. Suit/Blazer)"
          className="w-full max-w-xs rounded border border-line px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <datalist id="gallery-cats">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <button type="button" onClick={() => setOpen(true)} className="btn-brand !py-2 !text-[11px]" disabled={pending}>
          {pending ? "Adding…" : "+ Add photos"}
        </button>
        {msg && <span className="text-xs text-green-700">{msg}</span>}
      </div>
      {open && (
        <MediaPicker
          onClose={() => setOpen(false)}
          onConfirm={(urls) => {
            setOpen(false);
            if (!urls.length) return;
            start(async () => {
              await addGalleryItems(urls, category);
              setMsg(`Added ${urls.length} photo${urls.length === 1 ? "" : "s"}.`);
            });
          }}
        />
      )}
    </div>
  );
}

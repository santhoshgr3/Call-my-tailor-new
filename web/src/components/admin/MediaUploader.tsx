"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadImage } from "./ImageField";

export function MediaUploader() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setMsg("");
    let ok = 0;
    for (const f of Array.from(files)) {
      try {
        await uploadImage(f);
        ok++;
      } catch (e) {
        setMsg(`${f.name}: ${e instanceof Error ? e.message : "failed"}`);
      }
    }
    setBusy(false);
    if (ok) {
      setMsg(`Uploaded ${ok} image${ok === 1 ? "" : "s"}.`);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="btn-brand cursor-pointer !py-2 !text-[11px]">
        {busy ? "Uploading…" : "Upload images"}
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            onFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      <span className="text-xs text-faint">JPG, PNG, WebP, GIF or AVIF. Large photos are resized automatically.</span>
      {msg && <span className="text-xs text-brand-dark">{msg}</span>}
    </div>
  );
}

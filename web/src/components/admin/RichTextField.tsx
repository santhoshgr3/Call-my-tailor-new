"use client";

import { useEffect, useRef, useState } from "react";
import { uploadImage } from "./ImageField";

/** Strip scripts, embeds, inline event handlers and javascript: URLs using an inert parsed document. */
function sanitizeHtml(input: string): string {
  const doc = new DOMParser().parseFromString(input, "text/html");
  doc.querySelectorAll("script,iframe,object,embed,link,meta,base,form").forEach((n) => n.remove());
  doc.body.querySelectorAll("*").forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const n = attr.name.toLowerCase();
      const v = attr.value.trim().toLowerCase();
      if (n.startsWith("on") || ((n === "href" || n === "src") && v.startsWith("javascript:"))) {
        el.removeAttribute(attr.name);
      }
    }
  });
  return doc.body.innerHTML;
}

type Cmd = { label: string; title: string; run: () => void; cls?: string };

/** Visual editor that submits clean HTML through a hidden input named `name`. */
export function RichTextField({
  name,
  defaultValue = "",
  minHeight = 260,
}: {
  name: string;
  defaultValue?: string;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(defaultValue);
  const [source, setSource] = useState(false);
  const [busy, setBusy] = useState(false);

  // load the initial HTML into the editable area once (and after leaving source mode)
  useEffect(() => {
    if (!source && ref.current) {
      const clean = sanitizeHtml(html);
      ref.current.innerHTML = clean;
      if (clean !== html) setHtml(clean);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  const sync = () => setHtml(sanitizeHtml(ref.current?.innerHTML ?? ""));
  const exec = (cmd: string, value?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, value);
    sync();
  };

  async function insertImage(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      const url = await uploadImage(f);
      exec("insertImage", url);
    } catch {
      /* ignore failed upload */
    } finally {
      setBusy(false);
    }
  }

  const cmds: Cmd[] = [
    { label: "P", title: "Paragraph", run: () => exec("formatBlock", "P") },
    { label: "H2", title: "Heading 2", run: () => exec("formatBlock", "H2") },
    { label: "H3", title: "Heading 3", run: () => exec("formatBlock", "H3") },
    { label: "B", title: "Bold", run: () => exec("bold"), cls: "font-bold" },
    { label: "I", title: "Italic", run: () => exec("italic"), cls: "italic" },
    { label: "U", title: "Underline", run: () => exec("underline"), cls: "underline" },
    { label: "• List", title: "Bulleted list", run: () => exec("insertUnorderedList") },
    { label: "1. List", title: "Numbered list", run: () => exec("insertOrderedList") },
    { label: "❝", title: "Quote", run: () => exec("formatBlock", "BLOCKQUOTE") },
    {
      label: "Link",
      title: "Insert link",
      run: () => {
        const url = window.prompt("Link URL (https://… or /page)");
        if (url) exec("createLink", url);
      },
    },
    { label: "Unlink", title: "Remove link", run: () => exec("unlink") },
    { label: "Clear", title: "Clear formatting", run: () => exec("removeFormat") },
  ];

  const btn =
    "rounded border border-line bg-white px-2 py-1 text-xs font-semibold hover:border-brand hover:text-brand";

  return (
    <div className="rounded border border-line">
      <input type="hidden" name={name} value={html} />
      <div className="flex flex-wrap items-center gap-1 border-b border-line bg-soft p-2">
        {!source &&
          cmds.map((c) => (
            <button
              key={c.title}
              type="button"
              title={c.title}
              onMouseDown={(e) => e.preventDefault()}
              onClick={c.run}
              className={`${btn} ${c.cls ?? ""}`}
            >
              {c.label}
            </button>
          ))}
        {!source && (
          <label className={`${btn} cursor-pointer`} title="Insert image">
            {busy ? "Uploading…" : "Image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                insertImage(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}
        <button
          type="button"
          onClick={() => {
            if (!source) sync();
            setSource((v) => !v);
          }}
          className={`${btn} ml-auto ${source ? "border-brand text-brand" : ""}`}
        >
          {source ? "Visual editor" : "HTML source"}
        </button>
      </div>

      {source ? (
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          className="w-full p-3 font-mono text-xs outline-none"
          style={{ minHeight }}
        />
      ) : (
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={sync}
          onBlur={sync}
          className="prose-cmt max-w-none p-3 text-sm outline-none"
          style={{ minHeight }}
        />
      )}
    </div>
  );
}

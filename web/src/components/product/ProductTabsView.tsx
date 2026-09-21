"use client";

import { useEffect, useRef, useState } from "react";
import { ReviewForm } from "./ReviewForm";

type Tab = string; // "desc" | "specs" | "reviews" | "c0".."c5" (custom tabs)

const CLAMP_PX = 84;

function Stars({ value }: { value: number }) {
  const full = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span className="text-[15px] leading-none tracking-[2px] text-[#f5a623]" aria-label={`${value.toFixed(1)} out of 5`}>
      {"★".repeat(full)}
      <span className="text-[#b5b5b5]">{"☆".repeat(5 - full)}</span>
    </span>
  );
}

export function ProductTabsView({
  productId,
  descriptionHtml,
  specs,
  reviews,
  customTabs = [],
}: {
  productId: string;
  descriptionHtml: string;
  specs: { key: string; value: string }[];
  customTabs?: { title: string; html: string }[];
  reviews: { id: string; customerName: string; rating: number; title: string | null; body: string; createdAt: Date }[];
}) {
  const [tab, setTab] = useState<Tab>("desc");
  const [open, setOpen] = useState(false);
  const [long, setLong] = useState(false);
  const descRef = useRef<HTMLDivElement>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const el = descRef.current;
    if (el) setLong(el.scrollHeight > CLAMP_PX + 8);
  }, [descriptionHtml, tab]);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const tabs: { id: Tab; label: string }[] = [
    { id: "desc", label: "Description" },
    ...(specs.length ? [{ id: "specs" as Tab, label: "Specifications" }] : []),
    { id: "reviews", label: "Reviews" },
    ...customTabs.map((t, i) => ({ id: `c${i}`, label: t.title })),
  ];

  function goReviews(form: boolean) {
    setTab("reviews");
    setShowForm(form);
  }

  return (
    <div>
      <div role="tablist" className="flex flex-wrap gap-x-6 gap-y-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b px-0.5 pb-2 text-[15px] font-semibold uppercase tracking-wide transition-colors ${
              tab === t.id ? "border-brand text-ink" : "border-transparent text-[#8a8a8a] hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="pt-4">
        {tab === "desc" && (
          <div className="relative">
            <div
              ref={descRef}
              style={!open && long ? { maxHeight: CLAMP_PX } : undefined}
              className="prose-cmt overflow-hidden text-[15px] leading-6 text-muted [&_p:last-child]:mb-0"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
            {long && !open && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
            )}
            {long && (
              <div className={open ? "mt-2" : "absolute inset-x-0 bottom-0 flex justify-center"}>
                <button
                  onClick={() => setOpen((o) => !o)}
                  className="rounded-sm bg-[#12358a] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#0d2867]"
                >
                  {open ? "⌃ Show Less" : "⌄ Show More"}
                </button>
              </div>
            )}
          </div>
        )}

        {tab === "specs" && (
          <dl className="grid grid-cols-[minmax(110px,170px)_1fr] border-t border-line text-sm">
            {specs.map((s) => (
              <div key={s.key} className="contents">
                <dt className="border-b border-line bg-soft px-3 py-2.5 font-semibold text-ink">{s.key}</dt>
                <dd className="border-b border-line px-3 py-2.5 text-muted">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {tab.startsWith("c") && customTabs[Number(tab.slice(1))] && (
          <div
            className="prose-cmt text-[15px] leading-6 text-muted [&_p:last-child]:mb-0"
            dangerouslySetInnerHTML={{ __html: customTabs[Number(tab.slice(1))].html }}
          />
        )}

        {tab === "reviews" && (
          <div>
            {reviews.length === 0 ? (
              <p className="text-sm text-faint">No reviews yet. Be the first to review this product.</p>
            ) : (
              <ul className="max-h-80 space-y-4 overflow-y-auto pr-2">
                {reviews.map((r) => (
                  <li key={r.id} className="border-b border-line pb-4 last:border-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Stars value={r.rating} />
                      <span className="text-sm font-bold">{r.customerName}</span>
                      <span className="text-xs text-faint">
                        {new Date(r.createdAt).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                    {r.title && <p className="mt-1 text-sm font-semibold">{r.title}</p>}
                    <p className="mt-1 text-sm text-muted">{r.body}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              {showForm || reviews.length === 0 ? (
                <ReviewForm productId={productId} />
              ) : (
                <button onClick={() => setShowForm(true)} className="text-sm font-semibold text-brand hover:underline">
                  Write a review
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* rating row */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px]">
        <Stars value={avg} />
        <button onClick={() => goReviews(false)} className="text-[#1a5fb4] underline hover:text-brand">
          {reviews.length} review{reviews.length === 1 ? "" : "s"}
        </button>
        <span className="text-faint">-</span>
        <button onClick={() => goReviews(true)} className="text-[#1a5fb4] underline hover:text-brand">
          Write a review
        </button>
      </div>
    </div>
  );
}

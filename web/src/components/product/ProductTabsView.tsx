"use client";

import { useState } from "react";
import { ReviewForm } from "./ReviewForm";

export function ProductTabsView({
  productId,
  descriptionHtml,
  specs,
  reviews,
}: {
  productId: string;
  descriptionHtml: string;
  specs: { key: string; value: string }[];
  reviews: { id: string; customerName: string; rating: number; title: string | null; body: string; createdAt: Date }[];
}) {
  const [tab, setTab] = useState<"desc" | "reviews">("desc");

  return (
    <div className="mt-10">
      <div className="flex gap-1 border-b border-line">
        <button
          onClick={() => setTab("desc")}
          className={`-mb-px border-b-2 px-4 py-2 text-xs font-bold uppercase ${
            tab === "desc" ? "border-brand text-brand" : "border-transparent text-faint"
          }`}
        >
          Description
        </button>
        <button
          onClick={() => setTab("reviews")}
          className={`-mb-px border-b-2 px-4 py-2 text-xs font-bold uppercase ${
            tab === "reviews" ? "border-brand text-brand" : "border-transparent text-faint"
          }`}
        >
          Reviews ({reviews.length})
        </button>
      </div>

      {tab === "desc" && (
        <div className="py-6">
          {specs.length > 0 && (
            <>
              <h3 className="mb-3 text-base font-bold">Item Specifics</h3>
              <table className="mb-6 w-full max-w-xl border border-line text-sm">
                <tbody>
                  {specs.map((s) => (
                    <tr key={s.key} className="border-b border-line last:border-0">
                      <td className="w-1/3 bg-soft px-3 py-2 font-semibold">{s.key}</td>
                      <td className="px-3 py-2">{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          <div
            className="prose-cmt max-w-none text-sm text-muted"
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />
        </div>
      )}

      {tab === "reviews" && (
        <div className="py-6">
          {reviews.length === 0 ? (
            <p className="text-sm text-faint">No reviews yet. Be the first to review this product.</p>
          ) : (
            <ul className="space-y-4">
              {reviews.map((r) => (
                <li key={r.id} className="border-b border-line pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400">
                      {"★".repeat(r.rating)}
                      <span className="text-line">{"★".repeat(5 - r.rating)}</span>
                    </span>
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
          <ReviewForm productId={productId} />
        </div>
      )}
    </div>
  );
}

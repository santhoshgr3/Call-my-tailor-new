"use client";

import { useState } from "react";

export function ReviewForm({ productId }: { productId: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [rating, setRating] = useState(5);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("busy");
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId,
          customerName: fd.get("customerName"),
          email: fd.get("email") || "",
          rating,
          title: fd.get("title") || "",
          body: fd.get("body"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not submit review.");
        setState("error");
        return;
      }
      setState("done");
    } catch {
      setError("Network error.");
      setState("error");
    }
  }

  const field = "w-full border border-line px-3 py-2 text-sm outline-none focus:border-brand";

  if (state === "done") {
    return (
      <div className="mt-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        Thanks! Your review has been submitted and will appear once approved.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 max-w-xl space-y-3 border-t border-line pt-6">
      <h3 className="text-sm font-bold uppercase">Write a review</h3>
      <div className="flex items-center gap-1 text-xl">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            onClick={() => setRating(n)}
            className={n <= rating ? "text-amber-400" : "text-line"}
            aria-label={`${n} stars`}
          >
            ★
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="customerName" required placeholder="Your name" className={field} />
        <input name="email" type="email" placeholder="Email (optional)" className={field} />
      </div>
      <input name="title" placeholder="Review title (optional)" className={field} />
      <textarea name="body" required rows={4} placeholder="Your review" className={field} />
      {error && <p className="text-xs text-brand">{error}</p>}
      <button className="btn-brand" disabled={state === "busy"}>
        {state === "busy" ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}

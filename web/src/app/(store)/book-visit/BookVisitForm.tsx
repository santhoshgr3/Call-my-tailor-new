"use client";

import { useState } from "react";

export function BookVisitForm({
  categories,
}: {
  categories: { name: string; slug: string }[];
}) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("busy");
    setError("");
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    try {
      const res = await fetch("/api/book-visit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not submit. Please try again.");
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
      <div className="rounded border border-green-200 bg-green-50 p-6 text-sm text-green-800">
        <p className="font-bold">Request received!</p>
        <p className="mt-1">
          Thank you. Our team will call you shortly to confirm your home visit slot.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <input name="name" required placeholder="Your name" className={field} />
      <input name="phone" required placeholder="Phone number" className={field} />
      <input name="email" type="email" placeholder="Email (optional)" className={field} />
      <select name="category" className={field} defaultValue="">
        <option value="">What do you want stitched?</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        name="address"
        required
        placeholder="Full address"
        className={`${field} sm:col-span-2`}
      />
      <input name="city" placeholder="City" className={field} />
      <input name="pincode" placeholder="Pincode" className={field} />
      <input name="preferredDate" type="date" className={field} />
      <input name="preferredTime" placeholder="Preferred time (e.g. 5–7 PM)" className={field} />
      <textarea
        name="message"
        rows={3}
        placeholder="Anything else we should know?"
        className={`${field} sm:col-span-2`}
      />
      {error && <p className="text-xs text-brand sm:col-span-2">{error}</p>}
      <button className="btn-brand sm:col-span-2" disabled={state === "busy"}>
        {state === "busy" ? "Submitting…" : "Book My Visit"}
      </button>
    </form>
  );
}

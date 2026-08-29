"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState(res.ok ? "done" : "error");
      if (res.ok) setEmail("");
    } catch {
      setState("error");
    }
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-md overflow-hidden rounded">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email address"
        className="flex-1 bg-white px-3 py-2.5 text-sm text-ink outline-none"
      />
      <button className="btn-brand !rounded-none" disabled={state === "loading"}>
        {state === "done" ? "Subscribed ✓" : state === "loading" ? "…" : "Subscribe"}
      </button>
    </form>
  );
}

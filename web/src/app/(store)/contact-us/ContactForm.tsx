"use client";

import { useState } from "react";

export function ContactForm() {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("busy");
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(fd.entries())),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not send.");
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
        Thanks for reaching out — we&apos;ll get back to you soon.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <input name="name" required placeholder="Your name" className={field} />
      <input name="email" type="email" required placeholder="Email" className={field} />
      <input name="phone" placeholder="Phone" className={field} />
      <input name="subject" placeholder="Subject" className={field} />
      <textarea
        name="message"
        required
        rows={4}
        placeholder="Your message"
        className={`${field} sm:col-span-2`}
      />
      {error && <p className="text-xs text-brand sm:col-span-2">{error}</p>}
      <button className="btn-brand sm:col-span-2" disabled={state === "busy"}>
        {state === "busy" ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}

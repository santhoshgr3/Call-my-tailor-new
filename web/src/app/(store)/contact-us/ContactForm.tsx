"use client";

import { useState } from "react";

const SUBJECTS = [
  "Order Tracking",
  "Order Modification",
  "Complaint",
  "Login Issue",
  "Join Our Team",
  "Return & Exchange",
  "Payment method",
  "Other Issue",
];

/** Contact form in the old site's markup (styled by the legacy page CSS). */
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

  if (state === "done") {
    return (
      <div className="default-form-area">
        <p style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", padding: 20, borderRadius: 4 }}>
          Thanks for reaching out — we&apos;ll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <div className="default-form-area">
      <form onSubmit={submit} className="default-form">
        <div className="row clearfix">
          <div className="col-md-6 col-sm-6 col-xs-12">
            <div className="form-group">
              <input name="name" type="text" required placeholder="Name" className="form-control" />
            </div>
          </div>
          <div className="col-md-6 col-sm-6 col-xs-12">
            <div className="form-group">
              <input name="email" type="email" required placeholder="E-Mail ID" className="form-control" />
            </div>
          </div>
          <div className="col-md-6 col-sm-6 col-xs-12">
            <div className="form-group">
              <input name="phone" type="text" placeholder="Mobile No." className="form-control" />
            </div>
          </div>
          <div className="col-md-6 col-sm-6 col-xs-12">
            <div className="form-group">
              <select name="subject" defaultValue="" className="form-control">
                <option value="">Subject</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-md-12 col-sm-12 col-xs-12">
            <div className="form-group">
              <textarea name="message" required rows={10} placeholder="Your Message...." className="form-control textarea" />
            </div>
          </div>
          <div className="col-md-12 col-sm-12 col-xs-12">
            {error && <p style={{ color: "#eb3740", fontSize: 13 }}>{error}</p>}
            <div className="form-group">
              <input type="submit" value={state === "busy" ? "Sending…" : "Send Message"} disabled={state === "busy"} />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

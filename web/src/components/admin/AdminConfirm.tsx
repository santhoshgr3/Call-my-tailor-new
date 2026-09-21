"use client";

import { useEffect } from "react";

/** Asks "are you sure?" before any admin form submits via a Delete / Remove button. */
export function AdminConfirm() {
  useEffect(() => {
    function onSubmit(e: Event) {
      const form = e.target as HTMLFormElement | null;
      if (!form || form.id === "bulk-form") return; // the bulk bar asks for itself
      const submitter = (e as SubmitEvent).submitter as HTMLElement | null;
      const label = (submitter?.textContent ?? "").trim();
      if (/^(delete|remove)\b/i.test(label)) {
        if (!window.confirm(`Are you sure you want to ${label.toLowerCase()}? This cannot be undone.`)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    }
    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, []);
  return null;
}

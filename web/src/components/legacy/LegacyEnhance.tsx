"use client";

import { useEffect } from "react";

/** Small behaviours the old theme provided with jQuery: FAQ accordions (one open at a time) and tabs. */
export function LegacyEnhance() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const tab = (e.target as HTMLElement).closest<HTMLAnchorElement>('.legacy-page a[data-toggle="tab"]');
      if (tab) {
        e.preventDefault();
        const nav = tab.closest(".nav");
        const root = nav?.parentElement;
        const target = root?.querySelector<HTMLElement>(tab.getAttribute("href") || "#none");
        if (nav && root && target) {
          nav.querySelectorAll("li").forEach((li) => li.classList.remove("active"));
          tab.closest("li")?.classList.add("active");
          root.querySelectorAll(".tab-content > .tab-pane").forEach((x) => x.classList.remove("active", "in"));
          target.classList.add("active", "in");
        }
        return;
      }
      const head = (e.target as HTMLElement).closest<HTMLElement>(".legacy-page .accordion-heading");
      if (!head) return;
      const group = head.closest(".yt-accordion-group");
      const inner = group?.querySelector<HTMLElement>(".yt-accordion-inner");
      if (!group || !inner) return;
      const wasOpen = inner.classList.contains("open");
      document.querySelectorAll(".legacy-page .yt-accordion-inner.open").forEach((n) => n.classList.remove("open"));
      document.querySelectorAll(".legacy-page .accordion-heading.active").forEach((n) => n.classList.remove("active"));
      if (!wasOpen) {
        inner.classList.add("open");
        head.classList.add("active");
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}

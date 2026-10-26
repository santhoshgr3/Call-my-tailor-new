"use client";

import { useEffect } from "react";

/** Move a Bootstrap carousel one slide forward (dir = 1) or back (dir = -1). */
function stepCarousel(carousel: Element, dir: number) {
  const items = Array.from(carousel.querySelectorAll<HTMLElement>(".carousel-inner > .item"));
  if (items.length < 2) return;
  const cur = Math.max(0, items.findIndex((i) => i.classList.contains("active")));
  items[cur].classList.remove("active");
  items[(cur + dir + items.length) % items.length].classList.add("active");
}

/**
 * Small behaviours the old theme provided with jQuery: FAQ accordions (one open at a time), tabs,
 * Bootstrap carousels (arrows + auto-advance) and the number counters (data-count).
 */
export function LegacyEnhance() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const slide = target.closest<HTMLElement>(".legacy-page [data-slide]");
      if (slide) {
        e.preventDefault();
        const carousel = slide.closest(".carousel");
        if (carousel) stepCarousel(carousel, slide.getAttribute("data-slide") === "prev" ? -1 : 1);
        return;
      }

      const tab = target.closest<HTMLAnchorElement>('.legacy-page a[data-toggle="tab"]');
      if (tab) {
        e.preventDefault();
        const nav = tab.closest(".nav");
        const root = nav?.parentElement;
        const pane = root?.querySelector<HTMLElement>(tab.getAttribute("href") || "#none");
        if (nav && root && pane) {
          nav.querySelectorAll("li").forEach((li) => li.classList.remove("active"));
          tab.closest("li")?.classList.add("active");
          root.querySelectorAll(".tab-content > .tab-pane").forEach((x) => x.classList.remove("active", "in"));
          pane.classList.add("active", "in");
        }
        return;
      }

      const head = target.closest<HTMLElement>(".legacy-page .accordion-heading");
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

    // auto-advancing carousels
    const timers = Array.from(document.querySelectorAll('.legacy-page .carousel[data-ride="carousel"]')).map((c) =>
      window.setInterval(() => stepCarousel(c, 1), 5000),
    );

    // counters: show the real number, counting up once the box scrolls into view
    const counters = Array.from(document.querySelectorAll<HTMLElement>(".legacy-page .counter[data-count]"));
    const run = (el: HTMLElement) => {
      const to = Number(el.dataset.count) || 0;
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / 1500);
        el.textContent = String(Math.round(to * p));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver((entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            run(en.target as HTMLElement);
            io?.unobserve(en.target);
          }
        }
      });
      counters.forEach((c) => io!.observe(c));
    } else {
      counters.forEach((c) => (c.textContent = c.dataset.count || c.textContent));
    }

    return () => {
      document.removeEventListener("click", onClick);
      timers.forEach((t) => window.clearInterval(t));
      io?.disconnect();
    };
  }, []);
  return null;
}

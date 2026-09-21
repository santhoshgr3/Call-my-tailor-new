"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/homepage", label: "Slider, banners & brands" },
  { href: "/admin/homepage/content", label: "Section content" },
];

export function HomepageTabs() {
  const path = usePathname();
  return (
    <div className="mb-6 flex flex-wrap gap-2 border-b border-line">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${
            path === t.href
              ? "border-brand text-brand"
              : "border-transparent text-faint hover:text-ink"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

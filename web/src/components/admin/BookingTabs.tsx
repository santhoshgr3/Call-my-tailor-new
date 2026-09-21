"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/bookings", label: "Requests" },
  { href: "/admin/bookings/services", label: "Services & prices" },
  { href: "/admin/bookings/settings", label: "Booking page" },
];

export function BookingTabs() {
  const path = usePathname();
  return (
    <div className="mb-6 flex flex-wrap gap-2 border-b border-line">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${
            path === t.href ? "border-brand text-brand" : "border-transparent text-faint hover:text-ink"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

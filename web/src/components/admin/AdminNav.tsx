"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const GROUPS: { title: string; items: { href: string; label: string }[] }[] = [
  {
    title: "Overview",
    items: [{ href: "/admin", label: "Dashboard" }],
  },
  {
    title: "Catalog",
    items: [
      { href: "/admin/products", label: "Products" },
      { href: "/admin/categories", label: "Categories" },
      { href: "/admin/reviews", label: "Reviews" },
      { href: "/admin/coupons", label: "Coupons" },
    ],
  },
  {
    title: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/bookings", label: "Home Visits" },
      { href: "/admin/customers", label: "Customers" },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/homepage", label: "Homepage" },
      { href: "/admin/blog", label: "Blog" },
      { href: "/admin/testimonials", label: "Testimonials" },
      { href: "/admin/pages", label: "Info Pages" },
      { href: "/admin/settings", label: "Site Settings" },
    ],
  },
  {
    title: "Inbox",
    items: [
      { href: "/admin/messages", label: "Contact Messages" },
      { href: "/admin/newsletter", label: "Newsletter" },
    ],
  },
];

export function AdminNav() {
  const path = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? path === "/admin" : path.startsWith(href);

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 text-sm">
      {GROUPS.map((g) => (
        <div key={g.title} className="mb-4">
          <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-faint">
            {g.title}
          </p>
          {g.items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={`block rounded px-2 py-1.5 ${
                isActive(it.href)
                  ? "bg-brand/10 font-semibold text-brand"
                  : "text-ink hover:bg-soft"
              }`}
            >
              {it.label}
            </Link>
          ))}
        </div>
      ))}
      <Link
        href="/"
        className="block rounded px-2 py-1.5 text-xs text-faint hover:bg-soft"
        target="_blank"
      >
        ↗ View storefront
      </Link>
    </nav>
  );
}

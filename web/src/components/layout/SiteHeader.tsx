"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { formatINR } from "@/lib/money";
import type { MenuNode } from "@/lib/catalog";
import type { SiteConfig } from "@/lib/settings";

const IG = "instagram",
  FB = "facebook",
  LI = "linkedin",
  YT = "youtube",
  PIN = "pinterest";

function SocialIcons({ socials }: { socials: Record<string, string> }) {
  const items: [string, string][] = [
    [IG, "Instagram"],
    [FB, "Facebook"],
    [LI, "LinkedIn"],
    [YT, "YouTube"],
    [PIN, "Pinterest"],
  ];
  return (
    <div className="flex items-center gap-3">
      {items.map(([k, label]) =>
        socials?.[k] ? (
          <a
            key={k}
            href={socials[k]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="text-white/90 hover:text-white text-xs font-semibold uppercase"
          >
            {label.slice(0, 2)}
          </a>
        ) : null,
      )}
    </div>
  );
}

export function SiteHeader({
  menu,
  site,
  session,
}: {
  menu: MenuNode[];
  site: SiteConfig;
  session: { firstName: string; role: string } | null;
}) {
  const router = useRouter();
  const { count, subtotal, setDrawerOpen } = useCart();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);

  const allCategoryOptions = menu.flatMap((m) => [
    { slug: m.slug, name: m.name, depth: 0, href: m.href },
    ...m.children.map((c) => ({ slug: c.slug, name: c.name, depth: 1, href: c.href })),
  ]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (cat) params.set("category", cat);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <header className="border-b border-line">
      {/* top bar */}
      <div className="bg-brand text-white">
        <div className="container-cmt flex h-9 items-center justify-between text-[12px]">
          <div className="flex items-center gap-2">
            {(site.top_bar ?? []).map((t, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="opacity-50">|</span>}
                {t}
              </span>
            ))}
          </div>
          <SocialIcons socials={site.socials ?? {}} />
        </div>
      </div>

      {/* main header */}
      <div className="container-cmt flex items-center gap-6 py-4">
        <Link href="/" className="shrink-0">
          <span className="block text-2xl font-extrabold uppercase leading-none text-brand-dark">
            Call<span className="text-brand">My</span>Tailor
          </span>
          <span className="mt-0.5 block text-[10px] uppercase tracking-[0.25em] text-faint">
            {site.tagline || "For Custom Clothing"}
          </span>
        </Link>

        <form
          onSubmit={submitSearch}
          className="hidden flex-1 items-stretch rounded border border-line md:flex"
        >
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="max-w-[160px] border-r border-line bg-soft px-3 text-xs outline-none"
          >
            <option value="">All Category</option>
            {allCategoryOptions.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.depth ? "— " : ""}
                {o.name}
              </option>
            ))}
          </select>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products…"
            className="flex-1 px-3 py-2 text-sm outline-none"
          />
          <button type="submit" className="bg-brand px-5 text-white" aria-label="Search">
            ⌕
          </button>
        </form>

        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="relative flex items-center gap-2"
          aria-label="Open cart"
        >
          <span className="relative grid h-10 w-10 place-items-center rounded-full bg-brand text-white">
            🛍
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-dark px-1 text-[10px] font-bold">
              {count}
            </span>
          </span>
          <span className="hidden text-left text-xs leading-tight lg:block">
            <span className="block font-semibold uppercase text-faint">My Order</span>
            <span className="block font-bold text-brand">{formatINR(subtotal)}</span>
          </span>
        </button>

        <button
          type="button"
          className="ml-auto text-2xl md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
        >
          ☰
        </button>
      </div>

      {/* nav bar */}
      <div className="border-t border-line bg-white">
        <div className="container-cmt hidden items-stretch gap-1 md:flex">
          <div className="group relative">
            <button className="flex h-11 items-center gap-2 bg-brand px-4 text-xs font-bold uppercase text-white">
              ☰ All Categories
            </button>
            <div className="invisible absolute left-0 top-full z-40 w-64 border border-line bg-white opacity-0 shadow-pop transition group-hover:visible group-hover:opacity-100">
              {menu.map((m) => (
                <div key={m.id} className="group/item relative border-b border-line last:border-0">
                  <Link
                    href={m.href}
                    className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-soft hover:text-brand"
                  >
                    {m.name}
                    {m.children.length > 0 && <span className="text-faint">›</span>}
                  </Link>
                  {m.children.length > 0 && (
                    <div className="invisible absolute left-full top-0 z-50 w-56 border border-line bg-white opacity-0 shadow-pop transition group-hover/item:visible group-hover/item:opacity-100">
                      {m.children.map((c) => (
                        <Link
                          key={c.id}
                          href={c.href}
                          className="block px-4 py-2 text-sm hover:bg-soft hover:text-brand"
                        >
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/"
            className="flex h-11 items-center px-4 text-xs font-bold uppercase text-brand"
          >
            Home
          </Link>

          <div
            className="relative"
            onMouseEnter={() => setCollectionOpen(true)}
            onMouseLeave={() => setCollectionOpen(false)}
          >
            <button className="flex h-11 items-center gap-1 px-4 text-xs font-bold uppercase text-brand-dark hover:text-brand">
              Collection ▾
            </button>
            {collectionOpen && (
              <div className="absolute left-0 top-full z-40 grid w-[640px] grid-cols-3 gap-x-4 gap-y-1 border border-line bg-white p-5 shadow-pop">
                {menu.map((m) => (
                  <div key={m.id} className="mb-2">
                    <Link
                      href={m.href}
                      className="block border-b border-line pb-1 text-[13px] font-bold uppercase text-brand-dark hover:text-brand"
                    >
                      {m.name}
                    </Link>
                    <ul className="mt-1 space-y-0.5">
                      {m.children.map((c) => (
                        <li key={c.id}>
                          <Link href={c.href} className="text-[13px] text-muted hover:text-brand">
                            {c.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          <a
            href="/book-visit"
            className="flex h-11 items-center px-4 text-xs font-bold uppercase text-brand-dark hover:text-brand"
          >
            Book Home Visit
          </a>
          <Link
            href="/blog"
            className="flex h-11 items-center px-4 text-xs font-bold uppercase text-brand-dark hover:text-brand"
          >
            Blog
          </Link>

          <div className="ml-auto flex items-center gap-3 text-xs">
            {session ? (
              <>
                <Link href="/account" className="font-semibold hover:text-brand">
                  Hi, {session.firstName}
                </Link>
                {session.role === "admin" && (
                  <Link href="/admin" className="font-semibold text-brand">
                    Admin
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/account/login" className="hover:text-brand">
                  Login
                </Link>
                <span className="text-line">or</span>
                <Link href="/account/register" className="hover:text-brand">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* top tags */}
      <div className="border-t border-line bg-soft">
        <div className="container-cmt flex items-center gap-3 overflow-x-auto py-2 text-xs no-scrollbar">
          <span className="font-bold uppercase text-brand-dark">Top Tags:</span>
          {(site.top_tags ?? []).map((t) => (
            <Link
              key={t}
              href={`/search?q=${encodeURIComponent(t)}`}
              className="whitespace-nowrap text-muted hover:text-brand"
            >
              {t}
            </Link>
          ))}
        </div>
      </div>

      {/* mobile menu */}
      {mobileOpen && (
        <div className="border-t border-line bg-white md:hidden">
          <form onSubmit={submitSearch} className="flex border-b border-line">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="flex-1 px-3 py-2 text-sm outline-none"
            />
            <button className="bg-brand px-4 text-white">⌕</button>
          </form>
          <nav className="max-h-[70vh] overflow-y-auto">
            <Link href="/" className="block border-b border-line px-4 py-3 text-sm font-semibold">
              Home
            </Link>
            {menu.map((m) => (
              <details key={m.id} className="border-b border-line">
                <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
                  {m.name}
                </summary>
                <div className="bg-soft">
                  <Link href={m.href} className="block px-6 py-2 text-sm text-brand">
                    All {m.name}
                  </Link>
                  {m.children.map((c) => (
                    <Link key={c.id} href={c.href} className="block px-6 py-2 text-sm text-muted">
                      {c.name}
                    </Link>
                  ))}
                </div>
              </details>
            ))}
            <a
              href="/book-visit"
              className="block border-b border-line px-4 py-3 text-sm font-semibold"
            >
              Book Home Visit
            </a>
            <Link href="/blog" className="block border-b border-line px-4 py-3 text-sm font-semibold">
              Blog
            </Link>
            {session ? (
              <Link href="/account" className="block px-4 py-3 text-sm font-semibold text-brand">
                My Account
              </Link>
            ) : (
              <Link
                href="/account/login"
                className="block px-4 py-3 text-sm font-semibold text-brand"
              >
                Login / Register
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

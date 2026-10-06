"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { useShopLists } from "@/components/shop/ShopListProvider";
import { BagIcon } from "@/components/ui/BagIcon";
import { formatINR } from "@/lib/money";
import type { MenuNode } from "@/lib/catalog";
import type { SiteConfig } from "@/lib/settings";
import { SocialIcons } from "./SocialIcons";

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
  const { wishlist, compare } = useShopLists();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);

  const nav = {
    all_categories_label: site.nav?.all_categories_label || "All Categories",
    home_label: site.nav?.home_label || "Home",
    collection_label: site.nav?.collection_label || "Collection",
    show_collection: site.nav?.show_collection !== false,
  };
  const logoSrc = site.logo || "/logo.png";
  const headerLinks = site.header_links?.length
    ? site.header_links
    : [
        { label: "Book Home Visit", href: "/book-visit" },
        { label: "Blog", href: "/blog" },
      ];

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
      {/* top bar (desktop) */}
      <div className="hidden bg-brand text-white md:block">
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

      {/* mobile header: menu | logo | search, then a scrolling quick-links strip */}
      <div className="md:hidden">
        <div className="flex items-center gap-2 px-3 py-2">
          <button type="button" aria-label="Menu" onClick={() => setMobileOpen(true)} className="shrink-0 p-1.5 text-brand-dark">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/" aria-label={site.brand || "Call My Tailor"} className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt={site.brand || "Call My Tailor"} width={160} height={57} className="h-9 w-auto" />
          </Link>
          <form onSubmit={submitSearch} className="ml-auto flex min-w-0 flex-1 items-stretch rounded border border-line bg-white">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search"
              aria-label="Search products"
              className="min-w-0 flex-1 bg-transparent px-2.5 py-1.5 text-sm outline-none"
            />
            <button type="submit" aria-label="Search" className="grid w-9 shrink-0 place-items-center text-brand-dark">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                <circle cx="11" cy="11" r="6.5" />
                <path d="M16 16l4.5 4.5" />
              </svg>
            </button>
          </form>
        </div>
        <nav className="no-scrollbar flex gap-5 overflow-x-auto whitespace-nowrap border-y border-line bg-white px-4 text-[13px] font-medium text-brand-dark">
          {nav.show_collection && (
            <button type="button" onClick={() => setMobileOpen(true)} className="py-2.5">
              {nav.collection_label}
            </button>
          )}
          {headerLinks.map((l) => (
            <a key={l.href + l.label} href={l.href} className="py-2.5">
              {l.label}
            </a>
          ))}
          {menu.map((m) => (
            <Link key={m.id} href={m.href} className="py-2.5">
              {m.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* main header (desktop) */}
      <div className="container-cmt hidden items-center gap-6 py-4 md:flex">
        <Link href="/" className="shrink-0" aria-label={site.brand || "Call My Tailor"}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt={site.brand || "Call My Tailor"}
            width={200}
            height={71}
            className="h-12 w-auto"
          />
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

        <div className="flex items-center gap-4 text-ink">
          <Link href="/wishlist" aria-label="Wish list" title="Wish list" className="relative hover:text-brand">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.3 3 5 6.3 5c1.9 0 3.5 1 4.5 2.5h.4C12.2 6 13.8 5 15.7 5 19 5 21.100 8.300 21.600 11.800 19.500 16.400 12 21 12 21z" />
            </svg>
            {wishlist.length > 0 && (
              <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
                {wishlist.length}
              </span>
            )}
          </Link>
          <Link href="/compare" aria-label="Compare products" title="Compare" className="relative hover:text-brand">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M4 8h14l-3-3M20 16H6l3 3" />
            </svg>
            {compare.length > 0 && (
              <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
                {compare.length}
              </span>
            )}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="relative flex items-center gap-2"
          aria-label="Open cart"
        >
          <span className="relative grid h-10 w-10 place-items-center rounded-full bg-brand text-white">
            <BagIcon className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-dark px-1 text-[10px] font-bold">
              {count}
            </span>
          </span>
          <span className="hidden text-left text-xs leading-tight lg:block">
            <span className="block font-semibold uppercase text-faint">My Order</span>
            <span className="block font-bold text-brand">{formatINR(subtotal)}</span>
          </span>
        </button>

      </div>

      {/* nav bar */}
      <div className="hidden border-t border-line bg-white md:block">
        <div className="container-cmt flex items-stretch gap-1">
          <div className="group relative">
            <button className="flex h-11 items-center gap-2 bg-brand px-4 text-xs font-bold uppercase text-white">
              ☰ {nav.all_categories_label}
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
            {nav.home_label}
          </Link>

          {nav.show_collection && (
          <div
            className="relative"
            onMouseEnter={() => setCollectionOpen(true)}
            onMouseLeave={() => setCollectionOpen(false)}
          >
            <button className="flex h-11 items-center gap-1 px-4 text-xs font-bold uppercase text-brand-dark hover:text-brand">
              {nav.collection_label} ▾
            </button>
            {collectionOpen && (
              <div className="absolute left-0 top-full z-40 grid w-[860px] max-w-[calc(100vw-2rem)] grid-flow-row grid-cols-4 items-start gap-x-6 gap-y-3 border border-line bg-white p-5 shadow-pop">
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
          )}

          {headerLinks.map((l) => (
            <a
              key={l.href + l.label}
              href={l.href}
              className="flex h-11 items-center px-4 text-xs font-bold uppercase text-brand-dark hover:text-brand"
            >
              {l.label}
            </a>
          ))}

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
      <div className="hidden border-t border-line bg-soft md:block">
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

      {/* mobile menu: slide-in drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[90] md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/55" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[84%] max-w-[340px] flex-col overflow-y-auto bg-[#f4f4f4] shadow-2xl">
            <div className="flex items-start justify-between px-4 pt-4">
              <Link href="/" onClick={() => setMobileOpen(false)} aria-label="Home">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoSrc} alt={site.brand || "Call My Tailor"} width={200} height={71} className="h-12 w-auto" />
              </Link>
              <button type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)} className="p-1 text-3xl leading-none text-brand-dark">
                ×
              </button>
            </div>

            <form
              onSubmit={(e) => {
                submitSearch(e);
                setMobileOpen(false);
              }}
              className="mx-4 mt-4 flex overflow-hidden rounded border border-line bg-white"
            >
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search"
                className="min-w-0 flex-1 px-3 py-2.5 text-sm outline-none"
              />
              <button type="submit" aria-label="Search" className="grid w-11 place-items-center bg-[#2a7fd4] text-white">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="M16 16l4.5 4.5" />
                </svg>
              </button>
            </form>

            <ul className="mt-3 text-[15px] text-brand-dark">
              <li>
                <Link href="/" onClick={() => setMobileOpen(false)} className="block px-4 py-3">
                  {nav.home_label}
                </Link>
              </li>
              {headerLinks.map((l) => (
                <li key={l.href + l.label}>
                  <a href={l.href} onClick={() => setMobileOpen(false)} className="block px-4 py-3">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-2 border-t border-line">
              {menu.map((m) => (
                <details key={m.id} className="group border-b border-line/70">
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-[15px] text-brand-dark">
                    <span aria-hidden className="text-brand-dark">➔</span>
                    <span className="flex-1">{m.name}</span>
                    <span aria-hidden className="text-xl leading-none text-faint group-open:hidden">+</span>
                    <span aria-hidden className="hidden text-xl leading-none text-faint group-open:inline">−</span>
                  </summary>
                  <div className="bg-white">
                    <Link href={m.href} onClick={() => setMobileOpen(false)} className="block px-11 py-2.5 text-sm font-semibold text-brand">
                      All {m.name}
                    </Link>
                    {m.children.map((c) => (
                      <Link
                        key={c.id}
                        href={c.href}
                        onClick={() => setMobileOpen(false)}
                        className="block px-11 py-2.5 text-sm text-muted"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </details>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 px-4 text-center text-[13px] text-muted">
              <Link href="/compare" onClick={() => setMobileOpen(false)} className="rounded border border-line bg-white py-3">
                Compare{compare.length ? ` (${compare.length})` : ""}
              </Link>
              <Link href="/wishlist" onClick={() => setMobileOpen(false)} className="rounded border border-line bg-white py-3">
                Wish List ({wishlist.length})
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setDrawerOpen(true);
                }}
                className="rounded border border-line bg-white py-3"
              >
                Order list ({count})
              </button>
              {session ? (
                <Link href="/account" onClick={() => setMobileOpen(false)} className="rounded border border-line bg-white py-3 font-semibold text-brand">
                  My Account
                </Link>
              ) : (
                <Link href="/account/login" onClick={() => setMobileOpen(false)} className="rounded border border-line bg-white py-3 font-semibold text-brand">
                  Login / Register
                </Link>
              )}
            </div>
            <div className="h-8 shrink-0" />
          </aside>
        </div>
      )}
    </header>
  );
}

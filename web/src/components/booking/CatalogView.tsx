"use client";

import { useState } from "react";
import Link from "next/link";
import { useVisit } from "./BookingProvider";
import { formatINRShort } from "@/lib/money";

type Service = {
  id: string;
  subcategory: string;
  title: string;
  stitching: number;
  fabricFrom: number;
  badge: string | null;
  image: string;
};

type Cat = { slug: string; label: string; subtitle: string; banner: string };

const BADGE: Record<string, string> = {
  Bestseller: "bg-red-600",
  Premium: "bg-purple-700",
  New: "bg-green-600",
  Trending: "bg-blue-600",
  Popular: "bg-rose-600",
};

function ServiceCard({ s, category }: { s: Service; category: string }) {
  const { cart, add, remove } = useVisit();
  const inCart = cart.some((i) => i.id === s.id);
  const [flash, setFlash] = useState(false);

  function toggle() {
    if (inCart) {
      remove(s.id);
      return;
    }
    add({ id: s.id, title: s.title, category, price: s.stitching, fabricFrom: s.fabricFrom, image: s.image });
    setFlash(true);
    setTimeout(() => setFlash(false), 1400);
  }

  return (
    <div className="group flex flex-col overflow-hidden border border-line bg-white transition-shadow hover:shadow-pop">
      <div className="relative aspect-[3/4] w-full overflow-hidden border-b border-line bg-soft">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={s.image}
          alt={s.title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {s.badge && (
          <span
            className={`absolute left-1.5 top-1.5 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-white ${
              BADGE[s.badge] || "bg-brand"
            }`}
          >
            {s.badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-2 sm:p-3">
        <h3 className="mb-1.5 text-xs font-bold leading-tight text-[#1a2744] sm:text-sm lg:text-base">
          {s.title}
        </h3>
        <div className="mb-2 flex-1 space-y-0.5 sm:mb-3">
          <div className="flex items-center justify-between text-[10px] text-faint sm:text-xs lg:text-sm">
            <span>Stitching Price</span>
            <span>{formatINRShort(s.stitching)}/-</span>
          </div>
          {s.fabricFrom > 0 && (
            <div className="flex items-center justify-between text-[10px] text-faint sm:text-xs lg:text-sm">
              <span>Fabric Starts at</span>
              <span>{formatINRShort(s.fabricFrom)}/-</span>
            </div>
          )}
        </div>
        <button
          onClick={toggle}
          className={`w-full py-1.5 text-[9px] font-semibold uppercase tracking-widest transition-all active:scale-95 sm:py-2 sm:text-[10px] ${
            inCart
              ? "border border-brand/40 bg-brand/10 text-brand hover:border-red-300 hover:bg-red-50 hover:text-red-600"
              : flash
                ? "bg-brand text-white"
                : "bg-[#0d1525] text-white hover:bg-brand"
          }`}
        >
          {inCart ? "✓ Selected" : flash ? "✓ Added!" : "Select"}
        </button>
      </div>
    </div>
  );
}

function SelectionPanel() {
  const { cart, remove, setFabric, totalPrice } = useVisit();
  return (
    <aside className="sticky top-4 hidden w-64 shrink-0 self-start overflow-hidden border border-line bg-white shadow-pop lg:flex lg:flex-col xl:w-72">
      <div className="flex items-center justify-between bg-[#1a2744] px-4 py-3">
        <h3 className="text-sm font-bold tracking-wide text-white">My Selection</h3>
        <span className="bg-brand px-2 py-0.5 text-[10px] font-bold tracking-widest text-white">
          {cart.length} ITEM{cart.length !== 1 ? "S" : ""}
        </span>
      </div>
      <div className="max-h-[52vh] space-y-2 overflow-y-auto px-3 py-3">
        {cart.map((item) => (
          <div key={item.id} className="border border-line bg-soft p-2">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt="" className="h-14 w-11 shrink-0 bg-[#f7f5f2] object-contain" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-[#1a2744]">{item.title}</p>
                <p className="mt-0.5 text-[11px] font-bold text-brand">{formatINRShort(item.price)}/-</p>
                {item.qty > 1 && <p className="text-[10px] text-faint">Qty: {item.qty}</p>}
              </div>
              <button
                onClick={() => remove(item.id)}
                className="shrink-0 text-xl leading-none text-gray-300 hover:text-red-400"
                aria-label="Remove"
              >
                ×
              </button>
            </div>
            <div className="mt-2 rounded border border-dashed border-gray-300 px-2 py-1.5">
              <p className="mb-1 text-[10px] text-muted">Do you have fabric?</p>
              <div className="flex gap-3">
                {(["yes", "no"] as const).map((v) => (
                  <label key={v} className="flex cursor-pointer items-center gap-1">
                    <input
                      type="radio"
                      name={`fabric-${item.id}`}
                      checked={item.hasFabric === v}
                      onChange={() => setFabric(item.id, v)}
                      className="cursor-pointer accent-brand"
                    />
                    <span className="text-[10px] capitalize text-muted">{v}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-3 border-t border-line bg-soft px-4 py-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-faint">Total Estimate</span>
          <span className="text-sm font-bold text-[#1a2744]">{formatINRShort(totalPrice)}/-</span>
        </div>
        <Link
          href="/book-visit/booking"
          className="flex w-full items-center justify-center gap-2 bg-[#1a2744] py-3 text-[11px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-brand"
        >
          Proceed To Book
        </Link>
      </div>
    </aside>
  );
}

export function CatalogView({
  category,
  items,
  categories,
}: {
  category: Cat;
  items: Service[];
  categories: Cat[];
}) {
  const { cart, totalCount, ready } = useVisit();
  const tabs = ["All Item", ...Array.from(new Set(items.map((p) => p.subcategory)))];
  const [tab, setTab] = useState("All Item");
  const visible = tab === "All Item" ? items : items.filter((p) => p.subcategory === tab);
  const hasItems = ready && cart.length > 0;

  return (
    <main className="pb-16 lg:pb-0">
      {/* Banner */}
      <div
        className="relative flex h-44 items-center justify-center bg-cover bg-center md:h-56"
        style={{ backgroundImage: `url('${category.banner}')` }}
      >
        <div className="absolute inset-0 bg-[#111c35]/70" />
        <div className="relative z-10 px-4 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand">{category.subtitle}</p>
          <h1 className="text-3xl font-extrabold uppercase tracking-wide text-white md:text-4xl">{category.label}</h1>
          <div className="mx-auto mt-3 h-0.5 w-12 bg-brand" />
        </div>
      </div>

      {/* Breadcrumb + category switch */}
      <div className="border-b border-line bg-[#f8f4ee]">
        <div className="container-cmt flex flex-wrap items-center justify-between gap-2 py-3 text-xs text-muted">
          <div className="flex items-center gap-2">
            <Link href="/book-visit" className="hover:text-brand">
              Book a Home Visit
            </Link>
            <span>›</span>
            <span className="font-semibold text-[#1a2744]">{category.label}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories
              .filter((c) => c.slug !== category.slug)
              .map((c) => (
                <Link
                  key={c.slug}
                  href={`/book-visit/${c.slug}`}
                  className="rounded-full border border-line bg-white px-3 py-1 font-semibold text-[#1a2744] hover:border-brand hover:text-brand"
                >
                  {c.label}
                </Link>
              ))}
          </div>
        </div>
      </div>

      <div className="container-cmt py-8">
        <div className={hasItems ? "lg:flex lg:items-start lg:gap-10" : ""}>
          <div className="min-w-0 flex-1">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-8 w-1 rounded bg-brand" />
              <div>
                <h2 className="text-lg font-extrabold uppercase tracking-wide text-[#1a2744]">Select your item</h2>
                <p className="text-xs text-faint">{visible.length} items available</p>
              </div>
            </div>

            <div className="sticky top-0 z-30 mb-6 flex flex-wrap gap-2 border-b border-line bg-white py-3 shadow-sm">
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                    tab === t
                      ? "bg-brand text-white"
                      : "border border-line bg-white text-muted hover:border-brand hover:text-brand"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {visible.length === 0 ? (
              <p className="py-12 text-center text-sm text-faint">No items in this section yet.</p>
            ) : (
              <div
                className={`grid gap-2 sm:gap-3 ${
                  hasItems
                    ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                    : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
                }`}
              >
                {visible.map((s) => (
                  <ServiceCard key={s.id} s={s} category={category.slug} />
                ))}
              </div>
            )}

            <div className="mt-10 flex flex-col items-center justify-between gap-4 border border-line bg-[#f8f4ee] p-6 sm:flex-row">
              <div>
                <p className="text-base font-bold text-[#1a2744]">Upload Your Design</p>
                <p className="mt-1 text-sm text-muted">Have your own design? Upload it and we&apos;ll stitch it for you.</p>
              </div>
              <Link href="/book-visit/booking" className="btn-brand shrink-0">
                Upload &amp; Book
              </Link>
            </div>
          </div>

          {hasItems && <SelectionPanel />}
        </div>
      </div>

      {ready && totalCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between bg-[#1a2744] px-5 py-3 text-white shadow-2xl lg:hidden">
          <div>
            <p className="text-base font-bold">
              {totalCount} item{totalCount !== 1 ? "s" : ""} selected
            </p>
            <p className="text-xs text-brand">Ready to book your home visit</p>
          </div>
          <Link href="/book-visit/booking" className="btn-brand !px-5 !py-2.5">
            Book Visit
          </Link>
        </div>
      )}
    </main>
  );
}

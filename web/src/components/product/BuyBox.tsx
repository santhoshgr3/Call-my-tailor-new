"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { useShopLists, COMPARE_MAX } from "@/components/shop/ShopListProvider";
import { formatINR } from "@/lib/money";

type OptionValue = { id: string; label: string; priceDelta: number };
type Option = {
  id: string;
  label: string;
  required: boolean;
  values: OptionValue[];
};

function needsSchedule(label: string) {
  const l = label.trim().toLowerCase();
  return l.includes("home visit") || l.includes("call") || l.includes("voice") || l.includes("video");
}

function isSizeOption(label: string) {
  return label.trim().toLowerCase().includes("size");
}

/** Local "now", rounded down to the minute, as a datetime-local input value. */
function nowLocal() {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const SHARE = [
  { key: "facebook", label: "Facebook", bg: "#1877f2", path: "M13.5 21v-8.2h2.8l.4-3.2h-3.2V7.5c0-.9.3-1.6 1.6-1.6h1.7V3.1C18.2 3 17.2 3 16.1 3c-2.4 0-4 1.5-4 4.2v2.4H9.3v3.2h2.8V21h1.4z" },
  { key: "x", label: "X", bg: "#000", path: "M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.78L17.75 3zm-1.08 16.16h1.7L7.4 4.75H5.58l11.09 14.41z" },
  { key: "pinterest", label: "Pinterest", bg: "#e60023", path: "M12 2.2a9.8 9.8 0 00-3.6 18.9c-.09-.8-.16-2 .03-2.9l1.17-4.95s-.3-.6-.3-1.48c0-1.4.8-2.44 1.8-2.44.85 0 1.26.64 1.26 1.4 0 .86-.55 2.14-.83 3.33-.24 1 .5 1.8 1.48 1.8 1.78 0 3.14-1.87 3.14-4.57 0-2.4-1.72-4.07-4.17-4.07-2.84 0-4.5 2.13-4.5 4.33 0 .86.33 1.78.74 2.28.08.1.1.19.07.29l-.28 1.12c-.04.18-.14.22-.33.13-1.24-.58-2-2.38-2-3.83 0-3.12 2.27-5.99 6.54-5.99 3.43 0 6.1 2.45 6.1 5.72 0 3.41-2.15 6.16-5.13 6.16-1 0-1.95-.52-2.27-1.14l-.62 2.35c-.22.86-.82 1.94-1.23 2.6A9.8 9.8 0 1012 2.2z" },
  { key: "whatsapp", label: "WhatsApp", bg: "#25d366", path: "M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2c-1.5 0-2.9-.4-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.200zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.700 6.700 0 01-3.300-2.900c-.2-.4.2-.4.700-1.300.1-.2 0-.3 0-.5l-.8-1.800c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.300-.9.900-.9 2.200s.9 2.500 1 2.700c.1.200 1.800 2.800 4.500 3.900 1.700.7 2.400.8 3.200.7.500-.1 1.500-.6 1.700-1.200.2-.6.2-1.100.2-1.200-.1-.1-.2-.2-.5-.3z" },
] as const;

export function BuyBox({
  product,
  oldPrice,
  options,
  bookingUrl,
  homeVisit,
  stock,
  sku,
  model,
  brand,
  unit,
  whatsapp,
}: {
  product: { productId: string; slug: string; name: string; price: number; image: string };
  oldPrice?: number | null;
  options: Option[];
  bookingUrl: string;
  homeVisit: { option_label: string; display_price: number; note: string };
  stock: string;
  sku?: string | null;
  model?: string | null;
  brand?: string | null;
  unit?: string | null;
  whatsapp?: string;
}) {
  const isHomeVisit = (label: string) =>
    label.trim().toLowerCase() === homeVisit.option_label.trim().toLowerCase();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(options.map((o) => [o.label, o.values[0]?.label ?? ""])),
  );
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const [schedule, setSchedule] = useState("");
  const { wishlist, compare, toggleWish, toggleCompare } = useShopLists();
  const [listMsg, setListMsg] = useState("");
  const inWish = wishlist.includes(product.slug);
  const inCompare = compare.includes(product.slug);
  const [pageUrl, setPageUrl] = useState("");
  useEffect(() => setPageUrl(window.location.href), []);
  const scheduleRef = useRef<HTMLInputElement>(null);

  const homeVisitSelected = Object.values(selected).some(isHomeVisit);
  const scheduleNeeded = Object.values(selected).some(needsSchedule);
  const inStock = !/out of stock/i.test(stock);
  const scheduleLabel = homeVisitSelected
    ? "Home Visit Schedule"
    : Object.values(selected).some((v) => v.trim().toLowerCase().includes("call"))
      ? "Call Schedule"
      : "Schedule";

  const effectivePrice = useMemo(() => {
    if (Object.values(selected).some(isHomeVisit)) return homeVisit.display_price;
    let delta = 0;
    for (const o of options) {
      const v = o.values.find((x) => x.label === selected[o.label]);
      if (v) delta += v.priceDelta;
    }
    return Math.max(0, product.price + delta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, selected, product.price, homeVisit]);

  function handleAdd(): boolean {
    for (const o of options) {
      if (o.required && !selected[o.label]) {
        setError(`Please choose ${o.label}`);
        return false;
      }
    }
    if (scheduleNeeded && !schedule) {
      setError("Please choose a date and time for the home visit / call");
      return false;
    }
    setError("");
    add({
      ...product,
      price: effectivePrice,
      qty,
      options: scheduleNeeded ? { ...selected, Schedule: schedule } : selected,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
    return true;
  }

  const shareHref = (key: string) => {
    const u = encodeURIComponent(pageUrl);
    const t = encodeURIComponent(product.name);
    switch (key) {
      case "facebook":
        return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
      case "x":
        return `https://twitter.com/intent/tweet?url=${u}&text=${t}`;
      case "pinterest":
        return `https://pinterest.com/pin/create/button/?url=${u}&description=${t}&media=${encodeURIComponent(product.image)}`;
      default:
        return `https://api.whatsapp.com/send?text=${t}%20${u}`;
    }
  };

  const enquiry = `https://api.whatsapp.com/send?phone=${(whatsapp || "").replace(/\D/g, "")}&text=${encodeURIComponent(
    `Hi, I would like to know more about "${product.name}".`,
  )}`;

  return (
    <div className="space-y-5">
      {/* Price / stock / brand box */}
      <div className="grid grid-cols-[auto_1fr] items-center gap-x-5 border-y border-line py-4 sm:grid-cols-[auto_1fr_auto]">
        <div className="pr-1">
          {homeVisitSelected ? (
            <>
              <p className="text-[28px] font-bold leading-none text-ink">{formatINR(homeVisit.display_price)}</p>
              <p className="mt-1.5 text-[15px] text-faint">Home Visit Charge</p>
            </>
          ) : (
            <>
              <p className="flex items-baseline gap-2 text-[28px] font-bold leading-none text-ink">
                {formatINR(effectivePrice)}
                {oldPrice ? (
                  <span className="text-sm font-normal text-faint line-through">{formatINR(oldPrice)}</span>
                ) : null}
              </p>
              {unit && <p className="mt-1.5 text-[15px] text-faint">{unit}</p>}
            </>
          )}
        </div>

        <ul className="space-y-0.5 border-l border-line pl-5 text-xs text-ink">
          <li className={`flex items-center gap-1.5 font-bold uppercase ${inStock ? "text-green-600" : "text-brand"}`}>
            <span aria-hidden>{inStock ? "✓" : "✕"}</span>
            {inStock ? "In stock" : "Out of stock"}
          </li>
          {model && (
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="text-[8px]">●</span>Model: {model}
            </li>
          )}
          {sku && (
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="text-[8px]">●</span>SKU: {sku}
            </li>
          )}
        </ul>

        {brand && (
          <div className="col-span-2 mt-3 justify-self-start sm:col-span-1 sm:mt-0 sm:justify-self-end">
            <span className="flex min-h-[52px] min-w-[72px] items-center justify-center border border-line bg-white px-3 text-center text-[11px] font-bold uppercase tracking-wide text-brand-dark">
              {brand}
            </span>
          </div>
        )}
      </div>
      {homeVisitSelected && <p className="-mt-2 text-xs text-faint">{homeVisit.note}</p>}

      {/* Options as chips — the size chart is hidden once a home visit or call is chosen,
          since sizing is then handled during that visit / call instead. */}
      {options
        .filter((o) => !(scheduleNeeded && isSizeOption(o.label)))
        .map((o) => (
        <div key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-[15px] font-bold text-ink">
            {o.label}
            {o.required && <span className="text-brand"> *</span>}
          </span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={o.label}>
            {o.values.map((v) => {
              const on = selected[o.label] === v.label;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setSelected((s) => ({ ...s, [o.label]: v.label }))}
                  className={`rounded-sm border px-2.5 py-1.5 text-sm transition-colors ${
                    on
                      ? "border-[#1f2d5a] bg-[#eceef5] font-semibold text-ink"
                      : "border-line bg-white text-muted hover:border-[#1f2d5a]"
                  }`}
                >
                  {v.label}
                  {v.priceDelta ? ` (+${formatINR(v.priceDelta)})` : ""}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {scheduleNeeded && (
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-faint">
            {scheduleLabel}
            <span className="text-brand"> *</span>
          </label>
          <div
            className="flex max-w-md cursor-pointer items-stretch border border-line"
            onClick={() => scheduleRef.current?.showPicker?.()}
          >
            <input
              ref={scheduleRef}
              type="datetime-local"
              suppressHydrationWarning
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              min={nowLocal()}
              className="w-full cursor-pointer px-3 py-2 text-sm outline-none"
            />
            <span className="grid w-11 shrink-0 place-items-center bg-brand text-white">📅</span>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-brand">{error}</p>}

      {/* Quantity + actions */}
      <div className="flex items-stretch gap-2.5">
        <div className="flex h-[46px] w-[100px] shrink-0 border border-[#cfcfcf] bg-white">
          <input
            aria-label="Quantity"
            value={qty}
            inputMode="numeric"
            onChange={(e) => setQty(Math.max(1, Math.min(99, Number(e.target.value.replace(/\D/g, "")) || 1)))}
            className="w-full min-w-0 px-2 text-center text-base outline-none"
          />
          <div className="flex w-7 shrink-0 flex-col border-l border-[#cfcfcf]">
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQty((q) => Math.min(99, q + 1))}
              className="flex-1 border-b border-[#cfcfcf] text-[10px] text-muted hover:bg-soft"
            >
              ︿
            </button>
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex-1 text-[10px] text-muted hover:bg-soft"
            >
              ﹀
            </button>
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={!inStock}
          className="flex h-[46px] min-w-0 flex-1 items-center justify-center gap-2 bg-[#12358a] px-3 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#0d2867] disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
            <path d="M7 18a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zM1 2v2h2l3.6 7.6-1.4 2.4A2 2 0 007 17h12v-2H7.4l1.1-2h7.5a2 2 0 001.75-1l3.6-6.5A1 1 0 0020.5 4H5.2l-.9-2H1z" />
          </svg>
          {added ? "Added ✓" : "Add to Order"}
        </button>

        <a
          href={enquiry}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-[46px] shrink-0 items-center justify-center gap-1.5 bg-[#4cae4c] px-4 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#3f9a3f] sm:px-6"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
            <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2c-1.5 0-2.9-.4-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2z" />
          </svg>
          Ask Expert
        </a>
      </div>

      <a href={bookingUrl} className="btn-outline w-full">
        Book Now
      </a>

      <hr className="border-line" />

      {/* Wish list + compare */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
        <button
          type="button"
          onClick={() => setListMsg(toggleWish(product.slug) ? "Added to your wish list." : "Removed from your wish list.")}
          aria-pressed={inWish}
          className="flex items-center gap-1.5 text-muted hover:text-brand"
        >
          <svg viewBox="0 0 24 24" className={`h-4 w-4 ${inWish ? "fill-brand text-brand" : "fill-none text-brand"}`} stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.3 3 5 6.300 5c1.900 0 3.500 1 4.500 2.500h.400C12.200 6 13.800 5 15.700 5 19 5 21.100 8.300 21.600 11.800 19.500 16.400 12 21 12 21z" />
          </svg>
          {inWish ? "In your Wish List" : "Add to Wish List"}
        </button>
        <button
          type="button"
          onClick={() => {
            const r = toggleCompare(product.slug);
            setListMsg(
              r === "added"
                ? "Added to compare."
                : r === "removed"
                  ? "Removed from compare."
                  : `You can compare up to ${COMPARE_MAX} products at a time.`,
            );
          }}
          aria-pressed={inCompare}
          className="flex items-center gap-1.5 text-muted hover:text-brand"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#12358a]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M4 8h13l-3-3M20 16H7l3 3" />
          </svg>
          {inCompare ? "In Compare" : "Compare this Product"}
        </button>
        {(wishlist.length > 0 || compare.length > 0) && (
          <span className="flex gap-4 text-xs">
            {wishlist.length > 0 && (
              <Link href="/wishlist" className="text-[#1a5fb4] underline hover:text-brand">
                View wish list ({wishlist.length})
              </Link>
            )}
            {compare.length > 0 && (
              <Link href="/compare" className="text-[#1a5fb4] underline hover:text-brand">
                Compare ({compare.length})
              </Link>
            )}
          </span>
        )}
      </div>
      {listMsg && (
        <p role="status" className="-mt-2 text-xs text-green-700">
          {listMsg}
        </p>
      )}

      {/* Share */}
      <div className="flex flex-wrap items-center gap-1.5">
        {SHARE.map((s) => (
          <a
            key={s.key}
            href={shareHref(s.key)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share on ${s.label}`}
            style={{ background: s.bg }}
            className="grid h-8 w-8 place-items-center rounded-[3px] text-white transition-opacity hover:opacity-85"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current" aria-hidden>
              <path d={s.path} />
            </svg>
          </a>
        ))}
        <a
          href={`mailto:?subject=${encodeURIComponent(product.name)}&body=${encodeURIComponent(pageUrl)}`}
          aria-label="Share by email"
          className="grid h-8 w-8 place-items-center rounded-[3px] bg-[#8a8a8a] text-white transition-opacity hover:opacity-85"
        >
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current" aria-hidden>
            <path d="M3 5h18a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1zm9 7.2L4.6 7 4 8.3l8 5.4 8-5.4-.6-1.3L12 12.200z" />
          </svg>
        </a>
      </div>
    </div>
  );
}

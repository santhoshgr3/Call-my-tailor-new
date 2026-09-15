"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { formatINR } from "@/lib/money";

type OptionValue = { id: string; label: string; priceDelta: number };
type Option = {
  id: string;
  label: string;
  required: boolean;
  values: OptionValue[];
};

const HOME_VISIT_CHARGE = 200;

function isHomeVisit(label: string) {
  return label.trim().toLowerCase() === "tailor home visit";
}

export function BuyBox({
  product,
  oldPrice,
  options,
  bookingUrl,
}: {
  product: { productId: string; slug: string; name: string; price: number; image: string };
  oldPrice?: number | null;
  options: Option[];
  bookingUrl: string;
}) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(options.map((o) => [o.label, o.values[0]?.label ?? ""])),
  );
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  const homeVisitSelected = Object.values(selected).some(isHomeVisit);

  const effectivePrice = useMemo(() => {
    if (Object.values(selected).some(isHomeVisit)) return HOME_VISIT_CHARGE;
    let delta = 0;
    for (const o of options) {
      const v = o.values.find((x) => x.label === selected[o.label]);
      if (v) delta += v.priceDelta;
    }
    return Math.max(0, product.price + delta);
  }, [options, selected, product.price]);

  function handleAdd() {
    for (const o of options) {
      if (o.required && !selected[o.label]) {
        setError(`Please choose ${o.label}`);
        return;
      }
    }
    setError("");
    add({ ...product, price: effectivePrice, qty, options: selected });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  return (
    <div className="space-y-4">
      <div>
        {homeVisitSelected ? (
          <>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-extrabold text-brand">{formatINR(HOME_VISIT_CHARGE)}</span>
              <span className="pb-1 text-xs font-bold uppercase text-faint">Home Visit Charge</span>
            </div>
            <p className="mt-1 text-xs text-faint">
              Balance payable after fitting &amp; final measurement at your doorstep.
            </p>
          </>
        ) : (
          <>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-extrabold text-brand">{formatINR(effectivePrice)}</span>
              {oldPrice ? (
                <span className="pb-0.5 text-base text-faint line-through">{formatINR(oldPrice)}</span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-faint">Ex Tax: {formatINR(effectivePrice)}</p>
          </>
        )}
      </div>

      {options.map((o) => (
        <div key={o.id}>
          <label className="mb-1 block text-xs font-bold uppercase text-faint">
            {o.label}
            {o.required && <span className="text-brand"> *</span>}
          </label>
          <select
            value={selected[o.label] ?? ""}
            onChange={(e) => setSelected((s) => ({ ...s, [o.label]: e.target.value }))}
            className="w-full border border-line px-3 py-2 text-sm outline-none"
          >
            {o.values.map((v) => (
              <option key={v.id} value={v.label}>
                {v.label}
                {v.priceDelta ? ` (+${formatINR(v.priceDelta)})` : ""}
              </option>
            ))}
          </select>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <span className="text-xs font-bold uppercase text-faint">Qty</span>
        <div className="flex items-center border border-line">
          <button className="px-3 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))}>
            −
          </button>
          <span className="w-10 text-center text-sm">{qty}</span>
          <button className="px-3 py-2" onClick={() => setQty((q) => q + 1)}>
            +
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-brand">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button onClick={handleAdd} className="btn-brand flex-1">
          {added ? "Added to Cart ✓" : "Add to Cart"}
        </button>
        <Link href="/checkout" onClick={handleAdd} className="btn-dark flex-1">
          Buy Now
        </Link>
      </div>
      <a href={bookingUrl} className="btn-outline w-full">
        Book Visit &amp; Order Now
      </a>
    </div>
  );
}

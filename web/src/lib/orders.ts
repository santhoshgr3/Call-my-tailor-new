import { db } from "./db";

export type IncomingItem = {
  productId: string;
  qty: number;
  options?: Record<string, string>;
};

/**
 * Authoritative pricing. Never trust a price coming from the client:
 * base price + the sum of the selected option-value price deltas, looked up
 * fresh from the database.
 */
export async function priceCart(items: IncomingItem[]) {
  const ids = [...new Set(items.map((i) => i.productId))];
  const products = await db.product.findMany({
    where: { id: { in: ids }, isActive: true },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      options: { include: { values: true } },
    },
  });
  const map = new Map(products.map((p) => [p.id, p]));

  const lines = items
    .map((i) => {
      const p = map.get(i.productId);
      if (!p) return null;
      const qty = Math.max(1, Math.min(50, Math.floor(i.qty)));
      const selected = i.options ?? {};

      let delta = 0;
      for (const opt of p.options) {
        const chosen = selected[opt.label];
        if (!chosen) continue;
        const val = opt.values.find((v) => v.label === chosen);
        if (val) delta += val.priceDelta;
      }

      const unitPrice = Math.max(0, p.price + delta);
      return {
        productId: p.id,
        name: p.name,
        sku: p.sku,
        image: p.images[0]?.url ?? null,
        unitPrice,
        qty,
        options: selected,
        lineTotal: unitPrice * qty,
      };
    })
    .filter(Boolean) as {
    productId: string;
    name: string;
    sku: string | null;
    image: string | null;
    unitPrice: number;
    qty: number;
    options: Record<string, string>;
    lineTotal: number;
  }[];

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  return { lines, subtotal };
}

export async function applyCoupon(code: string, subtotal: number) {
  if (!code) return { discount: 0, coupon: null as null | { code: string } };
  const c = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!c || !c.isActive) return { discount: 0, coupon: null };
  if (c.expiresAt && c.expiresAt < new Date()) return { discount: 0, coupon: null };
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) return { discount: 0, coupon: null };
  if (subtotal < c.minSubtotal) return { discount: 0, coupon: null };
  const discount =
    c.type === "percent" ? Math.round((subtotal * c.value) / 100) : Math.min(c.value, subtotal);
  return { discount, coupon: { code: c.code } };
}

export function shippingFor(subtotal: number) {
  if (subtotal === 0) return 0;
  return subtotal >= 4999 ? 0 : 199;
}

export async function nextOrderNumber() {
  const count = await db.order.count();
  return `CMT-${String(100000 + count + 1)}`;
}

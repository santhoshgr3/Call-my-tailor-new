export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  qty: number;
  options: Record<string, string>;
  key: string; // productId + options hash
};

export function lineKey(productId: string, options: Record<string, string>): string {
  const opt = Object.keys(options)
    .sort()
    .map((k) => `${k}=${options[k]}`)
    .join("&");
  return opt ? `${productId}::${opt}` : productId;
}

export function cartTotals(lines: CartLine[]) {
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  return { subtotal, count };
}

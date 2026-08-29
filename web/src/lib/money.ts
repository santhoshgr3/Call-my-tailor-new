export function formatINR(amount: number | null | undefined): string {
  const n = Math.round(Number(amount ?? 0));
  return "₹" + n.toLocaleString("en-IN") + ".00";
}

export function formatINRShort(amount: number | null | undefined): string {
  const n = Math.round(Number(amount ?? 0));
  return "₹" + n.toLocaleString("en-IN");
}

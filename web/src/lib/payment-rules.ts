/** "Customization on Call" and "Ready to Ship (Standard Size)" orders must be paid in full online. */
export function needsFullPayment(options: Record<string, string> | undefined): boolean {
  return Object.values(options ?? {}).some((v) => {
    const l = String(v).toLowerCase();
    return l.includes("ready to ship") || (/\bcall\b/.test(l) && !l.includes("home visit"));
  });
}

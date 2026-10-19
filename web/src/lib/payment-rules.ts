/** "Customization on Call" and "Ready to Ship (Standard Size)" orders must be paid in full online. */
export function needsFullPayment(options: Record<string, string> | undefined): boolean {
  return Object.values(options ?? {}).some((v) => {
    const l = String(v).toLowerCase();
    return l.includes("ready to ship") || (/\bcall\b/.test(l) && !l.includes("home visit"));
  });
}

/** True when the line has the "Tailor Home Visit" customization chosen. */
export function isHomeVisitLine(options: Record<string, string> | undefined, homeVisitLabel: string): boolean {
  const want = homeVisitLabel.trim().toLowerCase();
  return Object.values(options ?? {}).some((v) => String(v).trim().toLowerCase() === want);
}

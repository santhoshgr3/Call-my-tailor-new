/** Storefront tags and extra tabs stored on a product (plain strings in the DB). */
export type CustomTab = { title: string; html: string };

export function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of raw.split(",")) {
    const v = t.trim().replace(/\s+/g, " ").slice(0, 60);
    const k = v.toLowerCase();
    if (v && !seen.has(k)) {
      seen.add(k);
      out.push(v);
    }
  }
  return out.slice(0, 30);
}

export function serializeTags(raw: string): string | null {
  const list = parseTags(raw);
  return list.length ? list.join(", ") : null;
}

export function parseCustomTabs(raw: string | null | undefined): CustomTab[] {
  if (!raw) return [];
  try {
    return cleanCustomTabs(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function cleanCustomTabs(v: unknown): CustomTab[] {
  if (!Array.isArray(v)) return [];
  const out: CustomTab[] = [];
  for (const r of v) {
    if (!r || typeof r !== "object") continue;
    const title = String((r as Record<string, unknown>).title ?? "").trim().slice(0, 40);
    const html = String((r as Record<string, unknown>).html ?? "").trim().slice(0, 20000);
    if (title && html) out.push({ title, html });
  }
  return out.slice(0, 6);
}

export function serializeCustomTabs(v: unknown): string | null {
  const tabs = cleanCustomTabs(v);
  return tabs.length ? JSON.stringify(tabs) : null;
}

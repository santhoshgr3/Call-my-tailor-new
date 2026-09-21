import "server-only";
import { db } from "./db";
import { setSetting, FALLBACK_SITE, type SiteConfig } from "./settings";
import { bustStorefrontCache } from "./cache";
import { revalidatePath } from "next/cache";

/** Uncached read so admin read-modify-write cycles never work from a stale copy. */
export async function readSiteFresh(): Promise<SiteConfig> {
  try {
    const row = await db.setting.findUnique({ where: { key: "site" } });
    if (row) return JSON.parse(row.value) as SiteConfig;
  } catch {
    /* fall through */
  }
  return FALLBACK_SITE;
}

/** Merge a partial update into the `site` setting and refresh the storefront. */
export async function patchSite(patch: Partial<SiteConfig>) {
  const current = await readSiteFresh();
  await setSetting("site", { ...current, ...patch });
  bustStorefrontCache();
  revalidatePath("/", "layout");
}

export function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

export function jsonField<T>(fd: FormData, key: string, fallback: T): T {
  try {
    const v = JSON.parse(String(fd.get(key) ?? ""));
    return (v ?? fallback) as T;
  } catch {
    return fallback;
  }
}

/** Keep only the listed string keys of each row, trimmed; drop rows where every value is empty. */
export function cleanRows<K extends string>(
  rows: unknown,
  keys: readonly K[],
): Record<K, string>[] {
  if (!Array.isArray(rows)) return [];
  const out: Record<K, string>[] = [];
  for (const r of rows) {
    if (!r || typeof r !== "object") continue;
    const rec = {} as Record<K, string>;
    let any = false;
    for (const k of keys) {
      const v = String((r as Record<string, unknown>)[k] ?? "").trim();
      rec[k] = v;
      if (v) any = true;
    }
    if (any) out.push(rec);
  }
  return out;
}

export function cleanStrings(v: unknown): string[] {
  return Array.isArray(v) ? v.map((s) => String(s).trim()).filter(Boolean) : [];
}

import { revalidateTag, updateTag } from "next/cache";

/**
 * Drop the cached storefront reads (menu, site settings, homepage aggregate).
 * Uses updateTag (immediate expiry, read-your-own-writes) when called from a
 * Server Action, and falls back to stale-while-revalidate elsewhere.
 */
export function bustStorefrontCache() {
  for (const tag of ["catalog", "settings", "home"]) {
    try {
      updateTag(tag);
    } catch {
      try {
        (revalidateTag as unknown as (t: string, p?: string) => void)(tag, "max");
      } catch {
        /* ignore */
      }
    }
  }
}

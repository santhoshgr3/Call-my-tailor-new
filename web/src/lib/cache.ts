import { revalidateTag } from "next/cache";

/** Drop the cached storefront reads (menu, site settings, homepage aggregate). */
export function bustStorefrontCache() {
  for (const tag of ["catalog", "settings", "home"]) {
    try {
      // Next 16 wants a cacheLife profile as 2nd arg
      (revalidateTag as unknown as (t: string, p?: string) => void)(tag, "max");
    } catch {
      try {
        (revalidateTag as unknown as (t: string) => void)(tag);
      } catch {
        /* ignore */
      }
    }
  }
}

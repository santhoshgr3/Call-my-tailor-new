"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { bustStorefrontCache } from "@/lib/cache";
import {
  applyRecord,
  buildCtx,
  type ImportOptions,
  type RawRecord,
  type RowResult,
} from "@/lib/product-import";

/** Save one small batch of previewed rows. Called repeatedly by the import screen. */
export async function importChunk(
  records: RawRecord[],
  opts: ImportOptions,
): Promise<RowResult[]> {
  await requireAdmin();
  const safe = records.slice(0, 40);
  const ctx = await buildCtx(safe);
  const out: RowResult[] = [];
  for (const rec of safe) out.push(await applyRecord(rec, ctx, opts));
  bustStorefrontCache();
  revalidatePath("/admin/products");
  return out;
}

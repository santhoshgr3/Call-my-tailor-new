import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Public product summaries for the wish list and compare pages (active products only). */
export async function GET(req: Request) {
  const slugs = (new URL(req.url).searchParams.get("slugs") || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[a-z0-9-]{1,120}$/.test(s))
    .slice(0, 20);
  if (!slugs.length) return NextResponse.json({ products: [] });

  const rows = await db.product.findMany({
    where: { slug: { in: slugs }, isActive: true },
    select: {
      slug: true,
      name: true,
      price: true,
      oldPrice: true,
      sku: true,
      stockStatus: true,
      rating: true,
      ratingCount: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
      specs: { orderBy: { sortOrder: "asc" }, select: { key: true, value: true } },
    },
  });
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const products = slugs
    .map((s) => bySlug.get(s))
    .filter((r): r is NonNullable<typeof r> => !!r)
    .map((r) => ({
      slug: r.slug,
      name: r.name,
      price: r.price,
      oldPrice: r.oldPrice,
      sku: r.sku,
      stock: r.stockStatus,
      rating: r.rating,
      ratingCount: r.ratingCount,
      image: r.images[0]?.url || "/img/placeholder.svg",
      specs: r.specs,
    }));
  return NextResponse.json({ products });
}

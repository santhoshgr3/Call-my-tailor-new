import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildWorkbook } from "@/lib/product-import";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const template = url.searchParams.get("template") === "1";
  const format = url.searchParams.get("format") === "csv" ? "csv" : "xlsx";
  const q = (url.searchParams.get("q") || "").trim();

  const products = template
    ? []
    : await db.product.findMany({
        where: q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { sku: { contains: q, mode: "insensitive" } },
              ],
            }
          : undefined,
        orderBy: { createdAt: "asc" },
        include: {
          categories: { include: { category: { select: { slug: true } } } },
          images: { orderBy: { sortOrder: "asc" }, select: { url: true } },
          specs: { orderBy: { sortOrder: "asc" }, select: { key: true, value: true } },
          options: {
            orderBy: { sortOrder: "asc" },
            select: {
              label: true,
              values: { orderBy: { sortOrder: "asc" }, select: { label: true, priceDelta: true } },
            },
          },
        },
      });

  const buf = await buildWorkbook(products, template, format);
  const stamp = new Date().toISOString().slice(0, 10);
  const name = template ? "product-import-template" : `products-${stamp}`;
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type":
        format === "csv"
          ? "text/csv; charset=utf-8"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${name}.${format}"`,
      "Cache-Control": "no-store",
    },
  });
}

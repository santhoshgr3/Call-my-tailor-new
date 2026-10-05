import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Admin product lookup for pickers: ?q=text (search) or ?ids=a,b,c (resolve selected). */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = new URL(req.url).searchParams;
  const ids = (sp.get("ids") || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[a-z0-9]{10,40}$/i.test(s))
    .slice(0, 40);
  const q = (sp.get("q") || "").trim().slice(0, 60);

  const rows = await db.product.findMany({
    where: ids.length
      ? { id: { in: ids } }
      : q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { sku: { contains: q, mode: "insensitive" } },
            ],
          }
        : {},
    orderBy: { createdAt: "desc" },
    take: ids.length ? 40 : 12,
    select: { id: true, name: true, sku: true, isActive: true, images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } } },
  });
  return NextResponse.json({
    products: rows.map((r) => ({ id: r.id, name: r.name, sku: r.sku, isActive: r.isActive, image: r.images[0]?.url ?? "" })),
  });
}

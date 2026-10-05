import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const folder = new URL(req.url).searchParams.get("folder");
  const [items, groups, saved] = await Promise.all([
    db.media.findMany({
      where: { source: "admin", ...(folder !== null ? { folder } : {}) },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: { id: true, filename: true, size: true, createdAt: true, folder: true },
    }),
    db.media.groupBy({ by: ["folder"], where: { source: "admin" }, _count: true }),
    getSetting<string[]>("media_folders", []),
  ]);
  const folders = Array.from(new Set([...saved, ...groups.map((g) => g.folder).filter(Boolean)])).sort();
  return NextResponse.json({ items: items.map((m) => ({ ...m, url: `/media/${m.id}` })), folders });
}

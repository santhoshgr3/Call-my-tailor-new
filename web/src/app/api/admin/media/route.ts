import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const items = await db.media.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, filename: true, size: true, createdAt: true },
  });
  return NextResponse.json({ items: items.map((m) => ({ ...m, url: `/media/${m.id}` })) });
}

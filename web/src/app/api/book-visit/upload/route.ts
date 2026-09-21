import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);
const MAX_BYTES = 4 * 1024 * 1024;

// Best-effort throttle so the public upload cannot be used to fill the database.
const hits = new Map<string, number[]>();
function tooMany(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 20;
}

/** Customers attach a reference design (image or PDF) to their booking. */
export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  if (tooMany(ip)) {
    return NextResponse.json({ error: "Too many uploads. Please try again in a few minutes." }, { status: 429 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Only images and PDF files are allowed." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large (max 4 MB)." }, { status: 400 });
  }

  const data = Buffer.from(await file.arrayBuffer());
  const media = await db.media.create({
    data: {
      filename: (file.name || "design").slice(0, 120),
      mimeType: file.type,
      size: data.length,
      data,
      source: "customer",
    },
    select: { id: true },
  });
  return NextResponse.json({ url: `/media/${media.id}`, name: file.name, type: file.type });
}

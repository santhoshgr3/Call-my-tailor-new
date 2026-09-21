import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
// Vercel serverless request bodies are capped at ~4.5MB.
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 4MB)" }, { status: 400 });
  }

  const data = Buffer.from(await file.arrayBuffer());
  const media = await db.media.create({
    data: {
      filename: (file.name || "upload").slice(0, 120),
      mimeType: file.type,
      size: data.length,
      data,
    },
    select: { id: true },
  });

  return NextResponse.json({ url: `/media/${media.id}`, id: media.id });
}

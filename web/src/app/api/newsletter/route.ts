import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = z.object({ email: z.string().email() }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  await db.newsletterSubscriber.upsert({
    where: { email },
    create: { email },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

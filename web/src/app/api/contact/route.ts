import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contactSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 },
    );
  }
  const d = parsed.data;
  await db.contactMessage.create({
    data: {
      name: d.name,
      email: d.email,
      phone: d.phone || null,
      subject: d.subject || null,
      message: d.message,
    },
  });
  return NextResponse.json({ ok: true });
}

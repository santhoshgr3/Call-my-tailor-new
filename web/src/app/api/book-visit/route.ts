import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookingSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const booking = await db.homeVisitBooking.create({
    data: {
      name: d.name,
      phone: d.phone,
      email: d.email || null,
      address: d.address,
      city: d.city || null,
      pincode: d.pincode || null,
      category: d.category || null,
      preferredDate: d.preferredDate || null,
      preferredTime: d.preferredTime || null,
      message: d.message || null,
    },
  });
  return NextResponse.json({ ok: true, id: booking.id });
}

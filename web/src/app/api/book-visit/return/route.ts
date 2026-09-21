import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

/**
 * The customer came back from the Razorpay payment link. We cannot verify a
 * payment-link redirect, so the booking is marked "payment reported" and an admin
 * confirms it against the Razorpay dashboard.
 */
export async function POST(req: Request) {
  const parsed = z.object({ bookingId: z.string().min(1) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const booking = await db.homeVisitBooking.findUnique({
    where: { id: parsed.data.bookingId },
    select: { id: true, paymentStatus: true },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  if (booking.paymentStatus === "unpaid") {
    await db.homeVisitBooking.update({ where: { id: booking.id }, data: { paymentStatus: "reported" } });
  }
  return NextResponse.json({ ok: true });
}

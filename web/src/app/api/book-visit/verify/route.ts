import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyRazorpaySignature } from "@/lib/razorpay";

const schema = z.object({
  bookingId: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

/** Confirms an online home-visit payment after checking Razorpay's signature. */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const booking = await db.homeVisitBooking.findUnique({ where: { id: bookingId } });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.paymentRef !== razorpay_order_id) {
    return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
  }
  const ok = await verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  if (!ok) return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });

  await db.homeVisitBooking.update({
    where: { id: bookingId },
    data: { paymentStatus: "paid", status: "confirmed", paymentRef: razorpay_payment_id },
  });
  return NextResponse.json({ ok: true });
}

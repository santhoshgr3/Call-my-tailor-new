import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyRazorpaySignature } from "@/lib/razorpay";

const schema = z.object({
  orderId: z.string(),
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.paymentRef && order.paymentRef !== razorpay_order_id) {
    return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
  }

  const ok = verifyRazorpaySignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  );
  if (!ok) {
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  await db.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "paid",
      status: "confirmed",
      paymentRef: razorpay_payment_id,
    },
  });

  return NextResponse.json({ ok: true, orderNumber: order.orderNumber });
}

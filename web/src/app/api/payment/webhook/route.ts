import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRazorpayWebhookSecret } from "@/lib/razorpay";
import { notifyOrderPlaced } from "@/lib/whatsapp-notify";

/**
 * Razorpay → our server. Marks an order paid even when the customer closed the
 * browser before being redirected back. Verified with the webhook secret.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const secret = await getRazorpayWebhookSecret();
  const sig = req.headers.get("x-razorpay-signature") || "";
  if (!secret || !sig) return NextResponse.json({ error: "Not configured" }, { status: 400 });

  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  let valid = false;
  try {
    valid = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    valid = false;
  }
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  let event: {
    event?: string;
    payload?: {
      order?: { entity?: { id?: string } };
      payment?: { entity?: { id?: string; order_id?: string } };
    };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  if (event.event === "order.paid" || event.event === "payment.captured") {
    const rzpOrderId = event.payload?.order?.entity?.id || event.payload?.payment?.entity?.order_id || "";
    const paymentId = event.payload?.payment?.entity?.id || "";
    if (rzpOrderId) {
      const order = await db.order.findFirst({
        where: { OR: [{ paymentRef: rzpOrderId }, ...(paymentId ? [{ paymentRef: paymentId }] : [])] },
      });
      if (order && order.paymentStatus !== "paid") {
        await db.order.update({
          where: { id: order.id },
          data: { paymentStatus: "paid", status: "confirmed", paymentRef: paymentId || rzpOrderId },
        });
        await notifyOrderPlaced(order.id);
      }
    }
  }

  // payment.failed and anything else: acknowledge so Razorpay doesn't keep retrying
  return NextResponse.json({ ok: true });
}

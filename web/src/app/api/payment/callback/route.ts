import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { notifyOrderPlaced } from "@/lib/whatsapp-notify";

/**
 * Redirect-style Razorpay checkout: after paying, Razorpay POSTs the customer here
 * (form fields razorpay_payment_id / razorpay_order_id / razorpay_signature).
 * We verify the signature, mark the order paid, then send the customer to the success page.
 */
export async function POST(req: Request) {
  const origin = new URL(req.url).origin;
  const fail = (code: string) =>
    NextResponse.redirect(`${origin}/checkout?payment=${code}`, 303);

  const form = await req.formData().catch(() => null);
  const paymentId = String(form?.get("razorpay_payment_id") ?? "");
  const rzpOrderId = String(form?.get("razorpay_order_id") ?? "");
  const signature = String(form?.get("razorpay_signature") ?? "");
  if (!paymentId || !rzpOrderId || !signature) return fail("failed");

  // the order is stored with paymentRef = Razorpay order id until it is paid
  const order = await db.order.findFirst({
    where: { OR: [{ paymentRef: rzpOrderId }, { paymentRef: paymentId }] },
  });
  if (!order) return fail("failed");

  const ok = await verifyRazorpaySignature(rzpOrderId, paymentId, signature);
  if (!ok) return fail("failed");

  if (order.paymentStatus !== "paid") {
    await db.order.update({
      where: { id: order.id },
      data: { paymentStatus: "paid", status: "confirmed", paymentRef: paymentId },
    });
    await notifyOrderPlaced(order.id);
  }

  return NextResponse.redirect(
    `${origin}/checkout/success?order=${encodeURIComponent(order.orderNumber)}&paid=1`,
    303,
  );
}

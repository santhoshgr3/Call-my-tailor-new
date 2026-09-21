import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validation";
import { priceCart, applyCoupon, shippingFor, nextOrderNumber } from "@/lib/orders";
import { getSiteConfig, DEFAULT_STORE } from "@/lib/settings";
import { isRazorpayEnabled, razorpayKeyId, createRazorpayOrder } from "@/lib/razorpay";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid checkout data" },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const { lines, subtotal } = await priceCart(d.items);
  if (lines.length === 0) {
    return NextResponse.json(
      { error: "Your cart is empty or items are unavailable." },
      { status: 400 },
    );
  }

  const { discount, coupon } = await applyCoupon(d.couponCode || "", subtotal);
  const store = (await getSiteConfig()).store ?? DEFAULT_STORE;
  const shipping = shippingFor(subtotal - discount, store);
  const total = Math.max(0, subtotal - discount + shipping);

  const userId = await getSessionUserId();
  const orderNumber = await nextOrderNumber();

  const pay = (await getSiteConfig()).payments ?? {};
  const codOk = pay.cod_enabled !== false;
  const onlineOk = pay.online_enabled !== false && (await isRazorpayEnabled());
  if (d.paymentMethod === "cod" && !codOk) {
    return NextResponse.json({ error: "Cash on delivery is not available." }, { status: 400 });
  }
  if (d.paymentMethod === "razorpay" && !onlineOk && !codOk) {
    return NextResponse.json({ error: "Online payment is currently unavailable." }, { status: 400 });
  }
  const wantsOnline = d.paymentMethod === "razorpay" && onlineOk;

  const order = await db.order.create({
    data: {
      orderNumber,
      customerId: userId ?? undefined,
      email: d.email,
      phone: d.phone,
      status: "pending",
      paymentStatus: "unpaid",
      paymentMethod: wantsOnline ? "razorpay" : "cod",
      subtotal,
      discount,
      shipping,
      total,
      couponCode: coupon?.code ?? null,
      notes: d.notes || null,
      shippingAddress: JSON.stringify({
        fullName: d.fullName,
        line1: d.line1,
        line2: d.line2 || "",
        city: d.city,
        state: d.state,
        pincode: d.pincode,
        country: "India",
      }),
      items: {
        create: lines.map((l) => ({
          productId: l.productId,
          name: l.name,
          sku: l.sku,
          image: l.image,
          unitPrice: l.unitPrice,
          qty: l.qty,
          options: JSON.stringify(l.options),
          lineTotal: l.lineTotal,
        })),
      },
    },
  });

  if (coupon) {
    await db.coupon.update({
      where: { code: coupon.code },
      data: { usedCount: { increment: 1 } },
    });
  }

  if (wantsOnline) {
    try {
      const rzp = await createRazorpayOrder(total, order.orderNumber);
      await db.order.update({ where: { id: order.id }, data: { paymentRef: rzp.id } });
      return NextResponse.json({
        ok: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        total,
        razorpay: {
          keyId: await razorpayKeyId(),
          orderId: rzp.id,
          amount: rzp.amount,
          currency: rzp.currency,
        },
      });
    } catch (e) {
      if (!codOk) {
        // no offline fallback allowed: undo the order and report the failure
        await db.orderItem.deleteMany({ where: { orderId: order.id } });
        await db.order.delete({ where: { id: order.id } });
        if (coupon) {
          await db.coupon.update({ where: { code: coupon.code }, data: { usedCount: { decrement: 1 } } });
        }
        return NextResponse.json(
          { error: "Online payment could not be started. Please try again." },
          { status: 502 },
        );
      }
      // fall back to COD-style pending order if Razorpay call fails
      await db.order.update({
        where: { id: order.id },
        data: { paymentMethod: "cod" },
      });
      return NextResponse.json({
        ok: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        total,
        warning:
          e instanceof Error
            ? `Online payment unavailable (${e.message}). Order placed as pay-later.`
            : "Online payment unavailable. Order placed as pay-later.",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    total,
  });
}

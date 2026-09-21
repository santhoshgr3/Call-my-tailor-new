import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSiteConfig, resolveBooking } from "@/lib/settings";
import {
  bookingRequestSchema,
  isFutureOrToday,
  planPayment,
  priceItems,
} from "@/lib/booking";
import { createRazorpayOrder, razorpayKeyId } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = bookingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Please check the form and try again." },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const site = await getSiteConfig();
  const cfg = resolveBooking(site);

  if (!cfg.time_slots.includes(d.time)) {
    return NextResponse.json({ error: "Please pick one of the available time slots." }, { status: 400 });
  }
  if (!isFutureOrToday(d.date)) {
    return NextResponse.json({ error: "Please choose today or a future date." }, { status: 400 });
  }

  const { lines, total } = await priceItems(d.items);
  const charge = Math.max(0, Math.round(cfg.visit_charge));
  const plan = await planPayment(charge);

  const booking = await db.homeVisitBooking.create({
    data: {
      name: d.name,
      phone: d.phone,
      email: d.email,
      address: d.address,
      city: d.city,
      preferredDate: d.date,
      preferredTime: d.time,
      message: d.notes || null,
      location: d.location || null,
      totalPrice: total,
      visitCharge: charge,
      status: "new",
      paymentStatus: plan.mode === "none" && charge <= 0 ? "not_required" : "unpaid",
      designFiles: d.designFiles.length ? JSON.stringify(d.designFiles) : null,
      category: [...new Set(lines.map((l) => l.category))].join(", ") || null,
      items: { create: lines },
    },
    select: { id: true },
  });

  if (plan.mode === "razorpay") {
    try {
      const order = await createRazorpayOrder(charge, `visit-${booking.id.slice(-10)}`);
      await db.homeVisitBooking.update({ where: { id: booking.id }, data: { paymentRef: order.id } });
      return NextResponse.json({
        ok: true,
        id: booking.id,
        payment: {
          mode: "razorpay",
          keyId: await razorpayKeyId(),
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
        },
      });
    } catch {
      // Online payment could not start — fall back to the payment link if there is one.
      if (/^https?:\/\//i.test(cfg.payment_link)) {
        return NextResponse.json({ ok: true, id: booking.id, payment: { mode: "link", url: cfg.payment_link } });
      }
      return NextResponse.json({ ok: true, id: booking.id, payment: { mode: "none" } });
    }
  }

  return NextResponse.json({ ok: true, id: booking.id, payment: plan });
}

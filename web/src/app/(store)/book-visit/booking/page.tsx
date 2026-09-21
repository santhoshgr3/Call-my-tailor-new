import type { Metadata } from "next";
import { Suspense } from "react";
import { getSiteConfig, resolveBooking } from "@/lib/settings";
import { planPayment } from "@/lib/booking";
import { BookingForm } from "@/components/booking/BookingForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Confirm Your Home Visit" };

export default async function BookingPage() {
  const site = await getSiteConfig();
  const cfg = resolveBooking(site);
  const charge = Math.max(0, Math.round(cfg.visit_charge));
  const plan = await planPayment(charge);

  return (
    <Suspense fallback={null}>
      <BookingForm
        cfg={{
          formEyebrow: cfg.form_eyebrow,
          formTitle: cfg.form_title,
          notice: cfg.notice,
          emptyNote: cfg.empty_note,
          successTitle: cfg.success_title,
          successSteps: cfg.success_steps,
          timeSlots: cfg.time_slots,
          visitCharge: charge,
          paymentAvailable: plan.mode !== "none",
          phoneDisplay: site.contact?.phone || "",
        }}
      />
    </Suspense>
  );
}

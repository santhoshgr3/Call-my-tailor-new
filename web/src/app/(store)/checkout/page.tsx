import type { Metadata } from "next";
import { getCurrentUser, getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { isRazorpayEnabled } from "@/lib/razorpay";
import { CheckoutForm } from "./CheckoutForm";
import { getSiteConfig, DEFAULT_STORE, DEFAULT_HOME_VISIT } from "@/lib/settings";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const { payment } = await searchParams;
  const site = await getSiteConfig();
  const user = await getCurrentUser();
  const uid = await getSessionUserId();
  const address = uid
    ? await db.address
        .findFirst({ where: { customerId: uid, isDefault: true } })
        .catch(() => null)
    : null;

  return (
    <div className="container-cmt py-10">
      <h1 className="mb-6 text-2xl">Checkout</h1>
      <CheckoutForm
        defaults={{
          email: user?.email ?? "",
          phone: user?.phone ?? address?.phone ?? "",
          fullName: address?.fullName ?? [user?.firstName, user?.lastName].filter(Boolean).join(" "),
          line1: address?.line1 ?? "",
          line2: address?.line2 ?? "",
          city: address?.city ?? "",
          state: address?.state ?? "",
          pincode: address?.pincode ?? "",
        }}
        loggedIn={!!user}
        razorpayEnabled={(await isRazorpayEnabled()) && site.payments?.online_enabled !== false}
        codEnabled={site.payments?.cod_enabled !== false}
        store={site.store ?? DEFAULT_STORE}
        homeVisit={site.home_visit ?? DEFAULT_HOME_VISIT}
        notice={
          payment === "failed"
            ? "Your payment could not be confirmed. If money was deducted it will be refunded or the order confirmed shortly — please contact us."
            : payment === "cancelled"
              ? "Payment cancelled. Your order is saved as unpaid — you can try again."
              : ""
        }
      />
    </div>
  );
}

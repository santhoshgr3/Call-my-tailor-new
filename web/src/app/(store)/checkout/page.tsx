import type { Metadata } from "next";
import { getCurrentUser, getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { isRazorpayEnabled } from "@/lib/razorpay";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  const uid = await getSessionUserId();
  const address = uid
    ? await db.address.findFirst({ where: { customerId: uid, isDefault: true } })
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
        razorpayEnabled={isRazorpayEnabled()}
      />
    </div>
  );
}

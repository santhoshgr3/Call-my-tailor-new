import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Order placed" };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return (
    <div className="container-cmt py-20 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-100 text-3xl text-green-600">
        ✓
      </div>
      <h1 className="mt-6 text-2xl">Thank you! Your order is placed.</h1>
      {order && (
        <p className="mt-2 text-sm text-muted">
          Your order number is <span className="font-bold text-brand-dark">{order}</span>. Our team
          will call you shortly to schedule your measurement / home visit.
        </p>
      )}
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/account/orders" className="btn-outline">
          View My Orders
        </Link>
        <Link href="/" className="btn-brand">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

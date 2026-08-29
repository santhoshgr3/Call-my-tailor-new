import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/money";

export const metadata: Metadata = { title: "Track My Order" };

const STEPS = [
  { key: "pending", label: "Order placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "in_production", label: "In production" },
  { key: "ready", label: "Ready" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; contact?: string }>;
}) {
  const sp = await searchParams;
  const orderNo = (sp.order || "").trim();
  const contact = (sp.contact || "").trim().toLowerCase();

  let order = null as Awaited<ReturnType<typeof lookup>> | null;
  let notFound = false;
  if (orderNo && contact) {
    order = await lookup(orderNo, contact);
    notFound = !order;
  }

  const activeIdx = order
    ? order.status === "cancelled"
      ? -1
      : STEPS.findIndex((s) => s.key === order!.status)
    : -1;

  return (
    <div className="container-cmt py-10">
      <h1 className="section-title">Track My Order</h1>

      <form className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row" action="/track-my-order">
        <input
          name="order"
          defaultValue={orderNo}
          required
          placeholder="Order number (e.g. CMT-100001)"
          className="flex-1 border border-line px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <input
          name="contact"
          defaultValue={sp.contact || ""}
          required
          placeholder="Email or phone on the order"
          className="flex-1 border border-line px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button className="btn-brand">Track</button>
      </form>

      {notFound && (
        <p className="mx-auto mt-6 max-w-xl rounded border border-brand/40 bg-brand/5 p-3 text-center text-sm text-brand">
          No order found with that number and contact. Check the details and try again.
        </p>
      )}

      {order && (
        <div className="mx-auto mt-10 max-w-3xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold">{order.orderNumber}</h2>
            <span className="rounded bg-soft px-3 py-1 text-sm capitalize">
              {order.status.replace("_", " ")}
            </span>
          </div>
          <p className="mt-1 text-sm text-faint">
            Placed on {new Date(order.createdAt).toLocaleDateString("en-IN")} · Payment:{" "}
            {order.paymentStatus}
          </p>

          {order.status === "cancelled" ? (
            <p className="mt-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              This order was cancelled.
            </p>
          ) : (
            <ol className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-6">
              {STEPS.map((s, i) => (
                <li key={s.key} className="text-center">
                  <div
                    className={`mx-auto grid h-9 w-9 place-items-center rounded-full text-sm font-bold ${
                      i <= activeIdx
                        ? "bg-brand text-white"
                        : "border border-line bg-white text-faint"
                    }`}
                  >
                    {i <= activeIdx ? "✓" : i + 1}
                  </div>
                  <p
                    className={`mt-1 text-[11px] ${
                      i <= activeIdx ? "font-semibold text-brand-dark" : "text-faint"
                    }`}
                  >
                    {s.label}
                  </p>
                </li>
              ))}
            </ol>
          )}

          <div className="mt-8 rounded border border-line">
            <table className="w-full text-sm">
              <tbody>
                {order.items.map((it) => (
                  <tr key={it.id} className="border-t border-line first:border-0">
                    <td className="px-3 py-2">
                      {it.name} <span className="text-faint">× {it.qty}</span>
                    </td>
                    <td className="px-3 py-2 text-right">{formatINR(it.lineTotal)}</td>
                  </tr>
                ))}
                <tr className="border-t border-line font-bold">
                  <td className="px-3 py-2">Total</td>
                  <td className="px-3 py-2 text-right text-brand">{formatINR(order.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-sm text-faint">
            Have an account?{" "}
            <Link href="/account/orders" className="text-brand hover:underline">
              See all your orders
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

async function lookup(orderNumber: string, contact: string) {
  const order = await db.order.findUnique({
    where: { orderNumber: orderNumber.toUpperCase() },
    include: { items: true },
  });
  if (!order) return null;
  const digits = contact.replace(/\D/g, "");
  const emailMatch = order.email.toLowerCase() === contact;
  const phoneMatch = digits.length >= 6 && order.phone.replace(/\D/g, "").includes(digits);
  if (!emailMatch && !phoneMatch) return null;
  return order;
}

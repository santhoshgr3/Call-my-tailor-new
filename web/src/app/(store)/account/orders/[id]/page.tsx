import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireUser, getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/money";

export const metadata: Metadata = { title: "Order details" };

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser("/account");
  const uid = await getSessionUserId();
  const { id } = await params;
  const order = await db.order.findFirst({
    where: { id, customerId: uid! },
    include: { items: true },
  });
  if (!order) notFound();

  const addr = JSON.parse(order.shippingAddress || "{}");

  return (
    <div className="container-cmt py-10">
      <nav className="mb-4 text-xs text-faint">
        <Link href="/account" className="hover:text-brand">
          My Account
        </Link>{" "}
        / <span className="text-ink">{order.orderNumber}</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl">Order {order.orderNumber}</h1>
        <span className="rounded bg-soft px-3 py-1 text-sm capitalize">
          {order.status.replace("_", " ")}
        </span>
      </div>
      <p className="mt-1 text-sm text-faint">
        Placed on {new Date(order.createdAt).toLocaleString("en-IN")} · Payment:{" "}
        {order.paymentMethod.toUpperCase()} ({order.paymentStatus})
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded border border-line">
          <table className="w-full text-sm">
            <thead className="bg-soft text-left text-xs uppercase text-faint">
              <tr>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Qty</th>
                <th className="px-3 py-2 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it) => {
                const opts = it.options ? JSON.parse(it.options) : {};
                return (
                  <tr key={it.id} className="border-t border-line align-top">
                    <td className="px-3 py-3">
                      <div className="flex gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={it.image || "/img/placeholder.svg"}
                          alt=""
                          className="h-16 w-12 rounded object-cover"
                        />
                        <div>
                          <p className="font-semibold">{it.name}</p>
                          {it.sku && <p className="text-xs text-faint">SKU: {it.sku}</p>}
                          {Object.entries(opts).map(([k, v]) => (
                            <p key={k} className="text-xs text-faint">
                              {k}: {String(v)}
                            </p>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">{it.qty}</td>
                    <td className="px-3 py-3 text-right">{formatINR(it.lineTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <aside className="space-y-4">
          <div className="rounded border border-line p-4 text-sm">
            <h3 className="mb-2 text-xs font-bold uppercase text-faint">Summary</h3>
            <Row label="Subtotal" value={formatINR(order.subtotal)} />
            {order.discount > 0 && <Row label="Discount" value={`− ${formatINR(order.discount)}`} />}
            <Row label="Shipping" value={order.shipping ? formatINR(order.shipping) : "Free"} />
            <div className="mt-2 flex justify-between border-t border-line pt-2 font-bold">
              <span>Total</span>
              <span className="text-brand">{formatINR(order.total)}</span>
            </div>
          </div>
          <div className="rounded border border-line p-4 text-sm">
            <h3 className="mb-2 text-xs font-bold uppercase text-faint">Shipping Address</h3>
            <p className="font-semibold">{addr.fullName}</p>
            <p className="text-muted">
              {addr.line1}
              {addr.line2 ? `, ${addr.line2}` : ""}
            </p>
            <p className="text-muted">
              {addr.city}, {addr.state} — {addr.pincode}
            </p>
            <p className="text-muted">{order.phone}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-muted">{label}</span>
      <span>{value}</span>
    </div>
  );
}

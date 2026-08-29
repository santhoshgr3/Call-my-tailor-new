import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { PageHeader, Card, Field, inputCls, SubmitButton } from "@/components/admin/ui";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";
import { updateOrder } from "../actions";

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: { items: true, customer: true },
  });
  if (!order) notFound();
  const addr = JSON.parse(order.shippingAddress || "{}");

  return (
    <div>
      <PageHeader
        title={`Order ${order.orderNumber}`}
        subtitle={new Date(order.createdAt).toLocaleString("en-IN")}
        action={
          <Link href="/admin/orders" className="btn-outline !py-2 !text-[11px]">
            ← All orders
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 font-bold">Items</h2>
            <table className="w-full text-sm">
              <tbody>
                {order.items.map((it) => {
                  const opts = it.options ? JSON.parse(it.options) : {};
                  return (
                    <tr key={it.id} className="border-t border-line first:border-0 align-top">
                      <td className="py-2">
                        <div className="flex gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={it.image || "/img/placeholder.svg"}
                            alt=""
                            className="h-14 w-11 rounded border border-line object-cover"
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
                      <td className="py-2 text-center">×{it.qty}</td>
                      <td className="py-2 text-right font-semibold">{formatINR(it.lineTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
              <Row l="Subtotal" v={formatINR(order.subtotal)} />
              {order.discount > 0 && (
                <Row l={`Discount ${order.couponCode ? `(${order.couponCode})` : ""}`} v={`− ${formatINR(order.discount)}`} />
              )}
              <Row l="Shipping" v={order.shipping ? formatINR(order.shipping) : "Free"} />
              <div className="flex justify-between border-t border-line pt-1 font-bold">
                <span>Total</span>
                <span className="text-brand">{formatINR(order.total)}</span>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="mb-2 font-bold">Customer & shipping</h2>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase text-faint">Contact</p>
                <p>{order.email}</p>
                <p>{order.phone}</p>
                {order.customer && (
                  <Link
                    href={`/admin/customers/${order.customer.id}`}
                    className="text-brand hover:underline"
                  >
                    View customer
                  </Link>
                )}
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-faint">Ship to</p>
                <p>{addr.fullName}</p>
                <p>
                  {addr.line1}
                  {addr.line2 ? `, ${addr.line2}` : ""}
                </p>
                <p>
                  {addr.city}, {addr.state} — {addr.pincode}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <h2 className="mb-3 font-bold">Manage</h2>
          <form action={updateOrder} className="space-y-3">
            <input type="hidden" name="id" value={order.id} />
            <Field label="Order status">
              <select name="status" defaultValue={order.status} className={inputCls}>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Payment status">
              <select name="paymentStatus" defaultValue={order.paymentStatus} className={inputCls}>
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Internal notes">
              <textarea
                name="notes"
                defaultValue={order.notes ?? ""}
                rows={4}
                className={inputCls}
              />
            </Field>
            <SubmitButton>Update order</SubmitButton>
          </form>
          <p className="mt-3 text-xs text-faint">
            Payment method: {order.paymentMethod.toUpperCase()}
          </p>
        </Card>
      </div>
    </div>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{l}</span>
      <span>{v}</span>
    </div>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { requireUser, getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { logoutAction } from "@/lib/auth-actions";

export const metadata: Metadata = { title: "My Account" };

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_production: "In Production",
  ready: "Ready",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default async function AccountPage() {
  const user = await requireUser("/account");
  const id = await getSessionUserId();

  const [orders, addresses] = await Promise.all([
    db.order.findMany({
      where: { customerId: id! },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { items: true },
    }),
    db.address.findMany({ where: { customerId: id! } }),
  ]);

  return (
    <div className="container-cmt py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl">My Account</h1>
        <div className="flex items-center gap-3 text-xs">
          <Link href="/account/profile" className="btn-outline !py-1.5 !text-[11px]">
            Profile
          </Link>
          <Link href="/account/addresses" className="btn-outline !py-1.5 !text-[11px]">
            Addresses
          </Link>
          <Link href="/account/orders" className="btn-outline !py-1.5 !text-[11px]">
            Orders
          </Link>
          <form action={logoutAction}>
            <button className="btn-outline !py-1.5 !text-[11px]">Logout</button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <section className="rounded border border-line p-5">
          <h2 className="mb-3 text-sm font-bold uppercase">Profile</h2>
          <p className="text-sm font-semibold">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-sm text-muted">{user.email}</p>
          {user.phone && <p className="text-sm text-muted">{user.phone}</p>}
          {user.role === "admin" && (
            <Link href="/admin" className="btn-brand mt-4 !py-2 !text-[11px]">
              Open Admin Panel
            </Link>
          )}
        </section>

        <section className="rounded border border-line p-5 md:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase">Addresses</h2>
            <Link href="/account/addresses" className="text-xs text-brand hover:underline">
              Manage
            </Link>
          </div>
          {addresses.length === 0 ? (
            <p className="text-sm text-faint">No saved addresses yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {addresses.map((a) => (
                <li key={a.id} className="rounded bg-soft p-3">
                  <p className="font-semibold">
                    {a.fullName} {a.isDefault && <span className="text-xs text-brand">(default)</span>}
                  </p>
                  <p className="text-muted">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} — {a.pincode}
                  </p>
                  <p className="text-muted">{a.phone}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-bold uppercase">Recent Orders</h2>
        {orders.length === 0 ? (
          <div className="rounded border border-line p-8 text-center text-sm text-faint">
            You haven&apos;t placed any orders yet.{" "}
            <Link href="/" className="font-semibold text-brand">
              Start shopping →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border border-line text-sm">
              <thead className="bg-soft text-left text-xs uppercase text-faint">
                <tr>
                  <th className="px-3 py-2">Order</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Items</th>
                  <th className="px-3 py-2">Total</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-line">
                    <td className="px-3 py-2 font-semibold">{o.orderNumber}</td>
                    <td className="px-3 py-2 text-muted">
                      {new Date(o.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-3 py-2 text-muted">{o.items.length}</td>
                    <td className="px-3 py-2 font-semibold text-brand">{formatINR(o.total)}</td>
                    <td className="px-3 py-2">
                      <span className="rounded bg-soft px-2 py-0.5 text-xs">
                        {STATUS_LABEL[o.status] || o.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <Link href={`/account/orders/${o.id}`} className="text-brand hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

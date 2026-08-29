import Link from "next/link";
import type { Metadata } from "next";
import { requireUser, getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/money";

export const metadata: Metadata = { title: "My Orders" };

export default async function OrdersPage() {
  await requireUser("/account/orders");
  const uid = await getSessionUserId();
  const orders = await db.order.findMany({
    where: { customerId: uid! },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="container-cmt py-10">
      <nav className="mb-4 text-xs text-faint">
        <Link href="/account" className="hover:text-brand">
          My Account
        </Link>{" "}
        / <span className="text-ink">Orders</span>
      </nav>
      <h1 className="mb-6 text-2xl">My Orders</h1>

      {orders.length === 0 ? (
        <div className="rounded border border-line p-10 text-center text-sm text-faint">
          No orders yet.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/account/orders/${o.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded border border-line p-4 hover:border-brand"
            >
              <div>
                <p className="font-bold">{o.orderNumber}</p>
                <p className="text-xs text-faint">
                  {new Date(o.createdAt).toLocaleString("en-IN")} · {o.items.length} item(s)
                </p>
              </div>
              <span className="rounded bg-soft px-2 py-1 text-xs capitalize">
                {o.status.replace("_", " ")}
              </span>
              <span className="font-bold text-brand">{formatINR(o.total)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

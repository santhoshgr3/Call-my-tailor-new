import Link from "next/link";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { formatINR } from "@/lib/money";
import { PageHeader, StatusPill } from "@/components/admin/ui";
import { ORDER_STATUSES } from "@/lib/constants";
import { Pagination } from "@/components/catalog/Pagination";

export const dynamic = "force-dynamic";
const PER = 25;

export default async function AdminOrders({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const where: Prisma.OrderWhereInput = {};
  if (sp.status) where.status = sp.status;
  if (sp.q)
    where.OR = [
      { orderNumber: { contains: sp.q } },
      { email: { contains: sp.q } },
      { phone: { contains: sp.q } },
    ];

  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER,
      take: PER,
      include: { items: true, customer: true },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER));

  return (
    <div>
      <PageHeader title="Orders" subtitle={`${total} orders`} />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={`rounded border px-3 py-1.5 text-xs ${
            !sp.status ? "border-brand bg-brand text-white" : "border-line"
          }`}
        >
          All
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`rounded border px-3 py-1.5 text-xs capitalize ${
              sp.status === s ? "border-brand bg-brand text-white" : "border-line"
            }`}
          >
            {s.replace("_", " ")}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-soft text-left text-xs uppercase text-faint">
            <tr>
              <th className="px-3 py-2">Order</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Items</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Payment</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-faint">
                  No orders.
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-line">
                <td className="px-3 py-2">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-semibold text-brand-dark hover:text-brand"
                  >
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  {o.customer
                    ? `${o.customer.firstName} ${o.customer.lastName ?? ""}`
                    : o.email}
                  <span className="block text-xs text-faint">{o.phone}</span>
                </td>
                <td className="px-3 py-2 text-faint">
                  {new Date(o.createdAt).toLocaleDateString("en-IN")}
                </td>
                <td className="px-3 py-2">{o.items.length}</td>
                <td className="px-3 py-2 font-semibold">{formatINR(o.total)}</td>
                <td className="px-3 py-2">
                  <StatusPill value={o.paymentStatus} />
                </td>
                <td className="px-3 py-2">
                  <StatusPill value={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pages={pages}
        makeHref={(p) =>
          `/admin/orders?${sp.status ? `status=${sp.status}&` : ""}page=${p}`
        }
      />
    </div>
  );
}

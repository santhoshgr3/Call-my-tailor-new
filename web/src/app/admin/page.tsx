import Link from "next/link";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { Card, PageHeader, StatusPill } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [
    products,
    activeProducts,
    categories,
    orders,
    revenueAgg,
    pendingOrders,
    newBookings,
    customers,
    pendingReviews,
    messages,
    recentOrders,
    recentBookings,
  ] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { isActive: true } }),
    db.category.count(),
    db.order.count(),
    db.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "paid" } }),
    db.order.count({ where: { status: "pending" } }),
    db.homeVisitBooking.count({ where: { status: "new" } }),
    db.customer.count({ where: { role: "customer" } }),
    db.review.count({ where: { isApproved: false } }),
    db.contactMessage.count({ where: { status: "new" } }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { items: true } }),
    db.homeVisitBooking.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  const allRevenue = await db.order.aggregate({ _sum: { total: true } });

  const stats = [
    { label: "Products", value: `${activeProducts}/${products}`, href: "/admin/products" },
    { label: "Categories", value: categories, href: "/admin/categories" },
    { label: "Orders", value: orders, href: "/admin/orders" },
    {
      label: "Order value (all)",
      value: formatINR(allRevenue._sum.total ?? 0),
      href: "/admin/orders",
    },
    { label: "Paid revenue", value: formatINR(revenueAgg._sum.total ?? 0), href: "/admin/orders" },
    { label: "Customers", value: customers, href: "/admin/customers" },
  ];

  const alerts = [
    { label: "Pending orders", value: pendingOrders, href: "/admin/orders?status=pending" },
    { label: "New home visits", value: newBookings, href: "/admin/bookings" },
    { label: "Reviews to moderate", value: pendingReviews, href: "/admin/reviews" },
    { label: "Unread messages", value: messages, href: "/admin/messages" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of your store" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-shadow hover:shadow-card">
              <p className="text-xs font-semibold uppercase text-faint">{s.label}</p>
              <p className="mt-1 text-2xl font-bold text-brand-dark">{s.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {alerts.map((a) => (
          <Link key={a.label} href={a.href}>
            <Card
              className={`transition-shadow hover:shadow-card ${
                a.value > 0 ? "border-brand/40 bg-brand/5" : ""
              }`}
            >
              <p className="text-xs font-semibold uppercase text-faint">{a.label}</p>
              <p
                className={`mt-1 text-2xl font-bold ${
                  a.value > 0 ? "text-brand" : "text-brand-dark"
                }`}
              >
                {a.value}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-brand hover:underline">
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-faint">No orders yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-t border-line first:border-0">
                    <td className="py-2">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-semibold text-brand-dark hover:text-brand"
                      >
                        {o.orderNumber}
                      </Link>
                      <span className="block text-xs text-faint">
                        {new Date(o.createdAt).toLocaleDateString("en-IN")} · {o.items.length} item(s)
                      </span>
                    </td>
                    <td className="py-2">
                      <StatusPill value={o.status} />
                    </td>
                    <td className="py-2 text-right font-semibold">{formatINR(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Recent Home Visit Requests</h2>
            <Link href="/admin/bookings" className="text-xs text-brand hover:underline">
              View all
            </Link>
          </div>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-faint">No requests yet.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {recentBookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-semibold">{b.name}</p>
                    <p className="text-xs text-faint">
                      {b.phone} · {b.city || "—"}
                    </p>
                  </div>
                  <StatusPill value={b.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

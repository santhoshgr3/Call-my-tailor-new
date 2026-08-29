import Link from "next/link";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminCustomers({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const customers = await db.customer.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q } },
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { phone: { contains: q } },
          ],
        }
      : {},
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } }, orders: { select: { total: true } } },
  });

  return (
    <div>
      <PageHeader title="Customers" subtitle={`${customers.length} customers`} />
      <form className="mb-4" action="/admin/customers">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name, email, phone…"
          className="w-72 rounded border border-line px-3 py-2 text-sm"
        />
      </form>
      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-soft text-left text-xs uppercase text-faint">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Orders</th>
              <th className="px-3 py-2">Spent</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-line">
                <td className="px-3 py-2">
                  <Link
                    href={`/admin/customers/${c.id}`}
                    className="font-semibold text-brand-dark hover:text-brand"
                  >
                    {c.firstName} {c.lastName}
                  </Link>
                </td>
                <td className="px-3 py-2 text-faint">{c.email}</td>
                <td className="px-3 py-2 text-faint">{c.phone || "—"}</td>
                <td className="px-3 py-2">
                  {c.role === "admin" ? (
                    <span className="rounded bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                      admin
                    </span>
                  ) : (
                    "customer"
                  )}
                </td>
                <td className="px-3 py-2">{c._count.orders}</td>
                <td className="px-3 py-2 font-semibold">
                  {formatINR(c.orders.reduce((s, o) => s + o.total, 0))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

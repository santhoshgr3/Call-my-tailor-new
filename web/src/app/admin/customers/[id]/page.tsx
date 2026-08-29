import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { PageHeader, Card, StatusPill } from "@/components/admin/ui";

export default async function AdminCustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await db.customer.findUnique({
    where: { id },
    include: {
      addresses: true,
      orders: { orderBy: { createdAt: "desc" }, include: { items: true } },
    },
  });
  if (!c) notFound();
  const spent = c.orders.reduce((s, o) => s + o.total, 0);

  return (
    <div>
      <PageHeader
        title={`${c.firstName} ${c.lastName ?? ""}`}
        subtitle={c.email}
        action={<Link href="/admin/customers" className="btn-outline !py-2 !text-[11px]">← All customers</Link>}
      />
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="space-y-4">
          <Card>
            <h2 className="mb-2 font-bold">Profile</h2>
            <p className="text-sm">{c.phone || "No phone"}</p>
            <p className="text-sm text-faint">Role: {c.role}</p>
            <p className="text-sm text-faint">Joined {new Date(c.createdAt).toLocaleDateString("en-IN")}</p>
            <p className="mt-2 text-sm font-bold">Lifetime value: {formatINR(spent)}</p>
          </Card>
          <Card>
            <h2 className="mb-2 font-bold">Addresses</h2>
            {c.addresses.length === 0 ? (
              <p className="text-sm text-faint">None</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {c.addresses.map((a) => (
                  <li key={a.id} className="rounded bg-soft p-2">
                    <p className="font-semibold">{a.fullName}</p>
                    <p className="text-muted">{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} — {a.pincode}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <Card>
          <h2 className="mb-3 font-bold">Orders ({c.orders.length})</h2>
          {c.orders.length === 0 ? (
            <p className="text-sm text-faint">No orders.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {c.orders.map((o) => (
                  <tr key={o.id} className="border-t border-line first:border-0">
                    <td className="py-2">
                      <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand-dark hover:text-brand">
                        {o.orderNumber}
                      </Link>
                      <span className="block text-xs text-faint">
                        {new Date(o.createdAt).toLocaleDateString("en-IN")} · {o.items.length} item(s)
                      </span>
                    </td>
                    <td className="py-2"><StatusPill value={o.status} /></td>
                    <td className="py-2 text-right font-semibold">{formatINR(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}

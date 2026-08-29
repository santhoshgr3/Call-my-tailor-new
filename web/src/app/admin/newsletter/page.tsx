import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminNewsletter() {
  const subs = await db.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } });
  const csv =
    "email,subscribed_at\n" +
    subs.map((s) => `${s.email},${s.createdAt.toISOString()}`).join("\n");

  return (
    <div>
      <PageHeader
        title="Newsletter Subscribers"
        subtitle={`${subs.length} subscribers`}
        action={
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
            download="newsletter.csv"
            className="btn-outline !py-2 !text-[11px]"
          >
            Export CSV
          </a>
        }
      />
      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-sm">
          <thead className="bg-soft text-left text-xs uppercase text-faint">
            <tr>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Subscribed</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id} className="border-t border-line">
                <td className="px-3 py-2">{s.email}</td>
                <td className="px-3 py-2 text-faint">
                  {new Date(s.createdAt).toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
            {subs.length === 0 && (
              <tr>
                <td colSpan={2} className="px-3 py-8 text-center text-faint">
                  No subscribers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

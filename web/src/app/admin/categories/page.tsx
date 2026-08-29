import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader, LinkButton, StatusPill } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminCategories() {
  const cats = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }],
    include: { _count: { select: { products: true, children: true } }, parent: true },
  });
  const roots = cats.filter((c) => !c.parentId);

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle={`${cats.length} categories`}
        action={<LinkButton href="/admin/categories/new" variant="brand">+ New category</LinkButton>}
      />

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-soft text-left text-xs uppercase text-faint">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Slug</th>
              <th className="px-3 py-2">Products</th>
              <th className="px-3 py-2">In menu</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {roots.map((root) => (
              <RowGroup key={root.id} root={root} all={cats} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function Row({ c, depth }: { c: any; depth: number }) {
  return (
    <tr className="border-t border-line">
      <td className="px-3 py-2" style={{ paddingLeft: 12 + depth * 20 }}>
        <Link
          href={`/admin/categories/${c.id}`}
          className="font-semibold text-brand-dark hover:text-brand"
        >
          {depth > 0 && <span className="text-faint">↳ </span>}
          {c.name}
        </Link>
      </td>
      <td className="px-3 py-2 text-faint">{c.slug}</td>
      <td className="px-3 py-2">{c._count.products}</td>
      <td className="px-3 py-2">{c.showInMenu ? "Yes" : "—"}</td>
      <td className="px-3 py-2">
        <StatusPill value={c.isActive ? "active" : "inactive"} />
      </td>
      <td className="px-3 py-2 text-right">
        <Link href={`/admin/categories/${c.id}`} className="text-brand hover:underline">
          Edit
        </Link>
      </td>
    </tr>
  );
}

function RowGroup({ root, all }: { root: any; all: any[] }) {
  const children = all.filter((c) => c.parentId === root.id);
  return (
    <>
      <Row c={root} depth={0} />
      {children.map((c) => (
        <Row key={c.id} c={c} depth={1} />
      ))}
    </>
  );
}

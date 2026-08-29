import Link from "next/link";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { formatINR } from "@/lib/money";
import { PageHeader, LinkButton, StatusPill } from "@/components/admin/ui";
import { Pagination } from "@/components/catalog/Pagination";
import { quickToggle, deleteProduct } from "./actions";

export const dynamic = "force-dynamic";
const PER = 20;

export default async function AdminProducts({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const q = (sp.q || "").trim();

  const where: Prisma.ProductWhereInput = {};
  if (q) where.OR = [{ name: { contains: q } }, { sku: { contains: q } }];
  if (sp.status === "active") where.isActive = true;
  if (sp.status === "inactive") where.isActive = false;
  if (sp.status === "no-image") where.hasImage = false;
  if (sp.category) where.categories = { some: { category: { slug: sp.category } } };

  const [total, items, cats] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PER,
      take: PER,
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, categories: true },
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true, name: true } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER));

  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { q, category: sp.category, status: sp.status, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return `/admin/products?${p.toString()}`;
  };

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${total} products`}
        action={<LinkButton href="/admin/products/new" variant="brand">+ New product</LinkButton>}
      />

      <form className="mb-4 flex flex-wrap gap-2" action="/admin/products">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name or SKU…"
          className="w-64 rounded border border-line px-3 py-2 text-sm"
        />
        <select name="category" defaultValue={sp.category || ""} className="rounded border border-line px-2 text-sm">
          <option value="">All categories</option>
          {cats.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={sp.status || ""} className="rounded border border-line px-2 text-sm">
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="no-image">Missing image</option>
        </select>
        <button className="btn-outline !py-2 !text-[11px]">Filter</button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-soft text-left text-xs uppercase text-faint">
            <tr>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">SKU</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Categories</th>
              <th className="px-3 py-2">Flags</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t border-line align-middle">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.images[0]?.url || "/img/placeholder.svg"}
                      alt=""
                      className="h-10 w-8 rounded border border-line object-cover"
                    />
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="font-semibold text-brand-dark hover:text-brand"
                    >
                      {p.name}
                    </Link>
                  </div>
                </td>
                <td className="px-3 py-2 text-faint">{p.sku || "—"}</td>
                <td className="px-3 py-2 font-semibold">{formatINR(p.price)}</td>
                <td className="px-3 py-2 text-xs text-faint">{p.categories.length}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {p.isFeatured && <Tag>Feat</Tag>}
                    {p.isBestSeller && <Tag>Best</Tag>}
                    {p.isNewArrival && <Tag>New</Tag>}
                    {p.isTrending && <Tag>Trend</Tag>}
                    {!p.hasImage && <Tag danger>No img</Tag>}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <form action={quickToggle}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="field" value="isActive" />
                    <button>
                      <StatusPill value={p.isActive ? "active" : "inactive"} />
                    </button>
                  </form>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/products/${p.id}`} className="text-brand hover:underline">
                      Edit
                    </Link>
                    <form
                      action={deleteProduct}
                    >
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-faint hover:text-brand">Delete</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pages={pages} makeHref={(p) => qs({ page: String(p) })} />
    </div>
  );
}

function Tag({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
        danger ? "bg-red-100 text-red-700" : "bg-soft text-faint"
      }`}
    >
      {children}
    </span>
  );
}

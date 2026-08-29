import Link from "next/link";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, StatusPill, inputCls } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

async function createPage(fd: FormData) {
  "use server";
  await requireAdmin();
  const slug = String(fd.get("slug") || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const title = String(fd.get("title") || "").trim();
  if (!slug || !title) return;
  const exists = await db.infoPage.findUnique({ where: { slug } });
  if (exists) redirect(`/admin/pages/${exists.id}`);
  const page = await db.infoPage.create({
    data: { slug, title, contentHtml: `<h2>${title}</h2><p>Edit this content.</p>` },
  });
  revalidatePath("/admin/pages");
  redirect(`/admin/pages/${page.id}`);
}

export default async function AdminPages() {
  const pages = await db.infoPage.findMany({ orderBy: { slug: "asc" } });
  return (
    <div>
      <PageHeader title="Info Pages" subtitle={`${pages.length} pages`} />

      <form action={createPage} className="mb-4 flex flex-wrap gap-2">
        <input name="title" placeholder="Page title" className={inputCls + " w-56"} />
        <input name="slug" placeholder="slug (e.g. shipping-policy)" className={inputCls + " w-56"} />
        <button className="btn-brand !py-2 !text-[11px]">+ New page</button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-soft text-left text-xs uppercase text-faint">
            <tr>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">URL</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="px-3 py-2 font-semibold">
                  <Link href={`/admin/pages/${p.id}`} className="text-brand-dark hover:text-brand">
                    {p.title}
                  </Link>
                </td>
                <td className="px-3 py-2 text-faint">/{p.slug}</td>
                <td className="px-3 py-2">
                  <StatusPill value={p.isPublished ? "published" : "draft"} />
                </td>
                <td className="px-3 py-2 text-right">
                  <Link href={`/admin/pages/${p.id}`} className="text-brand hover:underline">
                    Edit
                  </Link>
                  <Link
                    href={`/${p.slug}`}
                    target="_blank"
                    className="ml-3 text-faint hover:text-brand"
                  >
                    View ↗
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader, LinkButton, StatusPill } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminBlog() {
  const posts = await db.blogPost.findMany({ orderBy: { publishedAt: "desc" } });
  return (
    <div>
      <PageHeader
        title="Blog"
        subtitle={`${posts.length} posts`}
        action={<LinkButton href="/admin/blog/new" variant="brand">+ New post</LinkButton>}
      />
      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-soft text-left text-xs uppercase text-faint">
            <tr><th className="px-3 py-2">Title</th><th className="px-3 py-2">Slug</th><th className="px-3 py-2">Date</th><th className="px-3 py-2">Status</th><th className="px-3 py-2"></th></tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="px-3 py-2"><Link href={`/admin/blog/${p.id}`} className="font-semibold text-brand-dark hover:text-brand">{p.title}</Link></td>
                <td className="px-3 py-2 text-faint">{p.slug}</td>
                <td className="px-3 py-2 text-faint">{new Date(p.publishedAt).toLocaleDateString("en-IN")}</td>
                <td className="px-3 py-2"><StatusPill value={p.isPublished ? "published" : "draft"} /></td>
                <td className="px-3 py-2 text-right"><Link href={`/admin/blog/${p.id}`} className="text-brand hover:underline">Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

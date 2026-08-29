import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { dbStatus } from "@/lib/health";
import { SetupNotice } from "@/components/SetupNotice";

export const metadata: Metadata = { title: "Blog" };
export const dynamic = "force-dynamic";

export default async function BlogIndex() {
  const status = await dbStatus();
  if (status !== "ok") return <SetupNotice status={status} />;

  const posts = await db.blogPost
    .findMany({ where: { isPublished: true }, orderBy: { publishedAt: "desc" } })
    .catch(() => []);

  return (
    <div className="container-cmt py-10">
      <h1 className="section-title">Blog</h1>
      <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <article key={p.id} className="overflow-hidden rounded border border-line">
            <Link href={`/blog/${p.slug}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.coverImage || "/img/placeholder.svg"}
                alt={p.title}
                className="aspect-[16/9] w-full object-cover"
              />
            </Link>
            <div className="p-5">
              <p className="text-xs text-faint">
                {new Date(p.publishedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {p.author ? ` · ${p.author}` : ""}
              </p>
              <Link
                href={`/blog/${p.slug}`}
                className="mt-1 block text-lg font-bold leading-snug text-brand-dark hover:text-brand"
              >
                {p.title}
              </Link>
              <p className="mt-2 line-clamp-3 text-sm text-muted">{p.excerpt}</p>
              <Link
                href={`/blog/${p.slug}`}
                className="mt-3 inline-block text-xs font-bold uppercase text-brand"
              >
                Read More →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

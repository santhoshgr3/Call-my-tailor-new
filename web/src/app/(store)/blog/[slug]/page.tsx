import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { pageTitle } from "@/lib/seo";
import { dbStatus } from "@/lib/health";
import { SetupNotice } from "@/components/SetupNotice";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.blogPost.findUnique({ where: { slug } }).catch(() => null);
  if (!post) return { title: "Call My Tailor" };
  return {
    title: pageTitle(post.metaTitle || post.title),
    description: post.metaDescription || post.excerpt || undefined,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const status = await dbStatus();
  if (status !== "ok") return <SetupNotice status={status} />;

  const post = await db.blogPost
    .findUnique({ where: { slug, isPublished: true } })
    .catch(() => null);
  if (!post) notFound();

  const more = await db.blogPost
    .findMany({
      where: { isPublished: true, id: { not: post.id } },
      orderBy: { publishedAt: "desc" },
      take: 3,
    })
    .catch(() => []);

  return (
    <article className="container-cmt py-10">
      <nav className="mb-4 text-xs text-faint">
        <Link href="/" className="hover:text-brand">
          Home
        </Link>{" "}
        /{" "}
        <Link href="/blog" className="hover:text-brand">
          Blog
        </Link>{" "}
        / <span className="text-ink">{post.title}</span>
      </nav>

      <h1 className="max-w-3xl text-3xl leading-tight">{post.title}</h1>
      {post.subtitle && <p className="mt-2 max-w-3xl text-lg text-muted">{post.subtitle}</p>}
      <p className="mt-2 text-xs text-faint">
        {new Date(post.publishedAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        {post.author ? ` · By ${post.author}` : ""}
      </p>

      {post.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverImage}
          alt={post.title}
          className="my-6 max-h-[420px] w-full rounded object-cover"
        />
      )}

      <div
        className="prose-cmt max-w-3xl text-[15px] text-muted"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />

      {more.length > 0 && (
        <section className="mt-14">
          <h2 className="section-title">More from the blog</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {more.map((m) => (
              <Link
                key={m.id}
                href={`/blog/${m.slug}`}
                className="overflow-hidden rounded border border-line"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.coverImage || "/img/placeholder.svg"}
                  alt={m.title}
                  className="aspect-[16/9] w-full object-cover"
                />
                <p className="p-4 text-sm font-bold text-brand-dark">{m.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

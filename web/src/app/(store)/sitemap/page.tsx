import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Site Map" };
export const dynamic = "force-dynamic";

const MAIN = [
  { text: "Home", href: "/" },
  { text: "Book Home Visit", href: "/book-visit" },
  { text: "Gallery", href: "/gallery" },
  { text: "Blog", href: "/blog" },
  { text: "Contact Us", href: "/contact-us" },
  { text: "Track My Order", href: "/track-my-order" },
  { text: "Login", href: "/account/login" },
  { text: "Register", href: "/account/register" },
  { text: "My Account", href: "/account" },
  { text: "Wish List", href: "/wishlist" },
  { text: "Compare Products", href: "/compare" },
  { text: "Shopping Cart", href: "/cart" },
];

export default async function SiteMapPage() {
  const [cats, pages] = await Promise.all([
    db.category
      .findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, slug: true, name: true, parentId: true },
      })
      .catch(() => []),
    db.infoPage
      .findMany({ where: { isPublished: true }, orderBy: { title: "asc" }, select: { slug: true, title: true } })
      .catch(() => []),
  ]);
  const tops = cats.filter((c) => !c.parentId);

  return (
    <div className="container-cmt py-10">
      <h1 className="mb-6 text-2xl">Site Map</h1>
      <div className="grid gap-8 md:grid-cols-3">
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase">Shop by category</h2>
          <ul className="space-y-2 text-sm">
            {tops.map((t) => (
              <li key={t.id}>
                <Link href={`/${t.slug}`} className="font-semibold hover:text-brand">
                  {t.name}
                </Link>
                <ul className="mt-1 space-y-1 border-l border-line pl-3">
                  {cats
                    .filter((c) => c.parentId === t.id)
                    .map((c) => (
                      <li key={c.id}>
                        <Link href={`/${t.slug}/${c.slug}`} className="text-muted hover:text-brand">
                          {c.name}
                        </Link>
                      </li>
                    ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase">Information</h2>
          <ul className="space-y-1 text-sm">
            {pages.map((p) => (
              <li key={p.slug}>
                <Link href={`/${p.slug}`} className="text-muted hover:text-brand">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase">Pages</h2>
          <ul className="space-y-1 text-sm">
            {MAIN.map((m) => (
              <li key={m.href}>
                <Link href={m.href} className="text-muted hover:text-brand">
                  {m.text}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

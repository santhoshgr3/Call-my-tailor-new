import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function base() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const b = base();
  const now = new Date();

  const staticRoutes = [
    "",
    "/blog",
    "/book-visit",
    "/contact-us",
    "/track-my-order",
    "/about-us",
    "/how-it-works",
    "/why-callmytailor",
    "/gallery",
    "/faqs",
    "/price-list",
    "/how-to-choose-fabrics",
    "/customer-support",
    "/complaint-advice",
    "/join-us",
    "/payment-method",
    "/privacy-policy",
    "/terms-and-conditions",
    "/refund-replacement",
    "/testimonials",
  ].map((p) => ({
    url: `${b}${p}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.5,
  }));

  try {
    const [cats, products, posts, pages] = await Promise.all([
      db.category.findMany({
        where: { isActive: true },
        select: { slug: true, parent: { select: { slug: true } }, updatedAt: true },
      }),
      db.product.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      db.blogPost.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
      }),
      db.infoPage.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    const catUrls = cats.map((c) => ({
      url: `${b}/${c.parent ? `${c.parent.slug}/${c.slug}` : c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
    const productUrls = products.map((p) => ({
      url: `${b}/product/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
    const postUrls = posts.map((p) => ({
      url: `${b}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));
    const pageUrls = pages.map((p) => ({
      url: `${b}/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    }));

    // de-dupe (info page slugs overlap with the static list)
    const seen = new Set(staticRoutes.map((r) => r.url));
    const extra = [...catUrls, ...productUrls, ...postUrls, ...pageUrls].filter((r) => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });

    return [...staticRoutes, ...extra];
  } catch {
    return staticRoutes;
  }
}

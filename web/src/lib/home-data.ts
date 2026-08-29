import { unstable_cache } from "next/cache";
import { db } from "./db";
import { PRODUCT_CARD_SELECT, getRail, type ProductCard } from "./catalog";
import { getSiteConfig } from "./settings";

export type HomeData = {
  slides: { id: string; imageUrl: string; headline: string | null; link: string | null }[];
  promos: {
    id: string;
    imageUrl: string;
    title: string | null;
    subtitle: string | null;
    buttonLabel: string | null;
    link: string | null;
  }[];
  rails: { best: ProductCard[]; fresh: ProductCard[]; rated: ProductCard[] };
  brands: { id: string; name: string; logoUrl: string }[];
  testimonials: { id: string; name: string; role: string | null; text: string }[];
  posts: { id: string; slug: string; title: string; excerpt: string | null; coverImage: string | null }[];
  trendingTabs: { label: string; items: ProductCard[] }[];
  specThumbs: { title: string; slug: string; image: string }[];
  orderCats: { label: string; slug: string; image: string }[];
};

const PLACEHOLDER = "/img/placeholder.svg";

async function loadHomeData(): Promise<HomeData> {
  const site = await getSiteConfig();

  // one query for the whole category tree
  const allCats = await db.category.findMany({
    select: { id: true, slug: true, parentId: true },
  });
  const idBySlug = new Map(allCats.map((c) => [c.slug, c.id]));
  const kidsByParent = new Map<string, string[]>();
  for (const c of allCats) {
    if (c.parentId) {
      const arr = kidsByParent.get(c.parentId) ?? [];
      arr.push(c.id);
      kidsByParent.set(c.parentId, arr);
    }
  }
  const treeIds = (slug: string): string[] => {
    const id = idBySlug.get(slug);
    if (!id) return [];
    return [id, ...(kidsByParent.get(id) ?? [])];
  };

  const trendingDefs = [
    { label: "All", slug: "catalogue" },
    { label: "Accessories", slug: "accessories" },
    { label: "Ethnic Wear", slug: "ethnic-wear" },
    { label: "Kurta", slug: "kurta" },
    { label: "Suit/Blazer", slug: "suit-blazer" },
  ];

  // categories that need a representative thumbnail
  const thumbSlugs = new Set<string>();
  for (const s of site.specializations ?? []) thumbSlugs.add(s.slug);
  for (const o of site.order_by_category ?? []) thumbSlugs.add(o.slug.split("/").pop()!);
  const thumbCatIds = [...thumbSlugs].map((s) => idBySlug.get(s)).filter(Boolean) as string[];

  const [slides, promos, best, fresh, rated, brands, testimonials, posts, thumbRows, ...trending] =
    await Promise.all([
      db.heroSlide.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      db.promoBanner.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        take: 2,
      }),
      getRail("best", 10),
      getRail("new", 10),
      getRail("rating", 10),
      db.fabricBrand.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      db.testimonial.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      db.blogPost.findMany({
        where: { isPublished: true },
        orderBy: { publishedAt: "desc" },
        take: 3,
      }),
      // one query: images for products in every "thumbnail" category
      db.product.findMany({
        where: {
          isActive: true,
          hasImage: true,
          categories: { some: { categoryId: { in: thumbCatIds } } },
        },
        orderBy: [{ isBestSeller: "desc" }, { createdAt: "desc" }],
        take: 400,
        select: {
          images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
          categories: { select: { categoryId: true } },
        },
      }),
      ...trendingDefs.map((t) =>
        db.product.findMany({
          where: {
            isActive: true,
            categories: { some: { categoryId: { in: treeIds(t.slug) } } },
          },
          orderBy: [{ hasImage: "desc" }, { isBestSeller: "desc" }, { createdAt: "desc" }],
          take: 10,
          select: PRODUCT_CARD_SELECT,
        }),
      ),
    ]);

  // first image seen per category id
  const imageByCatId = new Map<string, string>();
  for (const row of thumbRows) {
    const url = row.images[0]?.url;
    if (!url) continue;
    for (const c of row.categories) {
      if (!imageByCatId.has(c.categoryId)) imageByCatId.set(c.categoryId, url);
    }
  }
  const thumbFor = (slug: string) => {
    const id = idBySlug.get(slug);
    return (id && imageByCatId.get(id)) || PLACEHOLDER;
  };

  return {
    slides: slides.map((s) => ({
      id: s.id,
      imageUrl: s.imageUrl,
      headline: s.headline,
      link: s.link,
    })),
    promos: promos.map((b) => ({
      id: b.id,
      imageUrl: b.imageUrl,
      title: b.title,
      subtitle: b.subtitle,
      buttonLabel: b.buttonLabel,
      link: b.link,
    })),
    rails: { best, fresh, rated },
    brands: brands.map((b) => ({ id: b.id, name: b.name, logoUrl: b.logoUrl })),
    testimonials: testimonials.map((t) => ({
      id: t.id,
      name: t.name,
      role: t.role,
      text: t.text,
    })),
    posts: posts.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      coverImage: p.coverImage,
    })),
    trendingTabs: trendingDefs.map((t, i) => ({ label: t.label, items: trending[i] })),
    specThumbs: (site.specializations ?? []).map((s) => ({ ...s, image: thumbFor(s.slug) })),
    orderCats: (site.order_by_category ?? []).map((o) => ({
      ...o,
      image: thumbFor(o.slug.split("/").pop()!),
    })),
  };
}

export const getHomeData = unstable_cache(loadHomeData, ["home-data-v1"], {
  revalidate: 120,
  tags: ["catalog", "home"],
});

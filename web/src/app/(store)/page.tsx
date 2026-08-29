import Link from "next/link";
import { db } from "@/lib/db";
import { getRail, PRODUCT_CARD_SELECT, type ProductCard as TCard } from "@/lib/catalog";
import { getSiteConfig, getSetting } from "@/lib/settings";
import { dbStatus } from "@/lib/health";
import { SetupNotice } from "@/components/SetupNotice";
import { ProductCard } from "@/components/product/ProductCard";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { ProductTabs } from "@/components/home/ProductTabs";
import { StatCounter } from "@/components/home/StatCounter";

export const dynamic = "force-dynamic";

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

async function trendingFor(slug: string): Promise<TCard[]> {
  const cat = await db.category.findUnique({ where: { slug }, select: { id: true } });
  if (!cat) return [];
  const kids = await db.category.findMany({ where: { parentId: cat.id }, select: { id: true } });
  return db.product.findMany({
    where: {
      isActive: true,
      categories: { some: { categoryId: { in: [cat.id, ...kids.map((k) => k.id)] } } },
    },
    orderBy: [{ isBestSeller: "desc" }, { createdAt: "desc" }],
    take: 10,
    select: PRODUCT_CARD_SELECT,
  });
}

export default async function HomePage() {
  const status = await dbStatus();
  if (status !== "ok") return <SetupNotice status={status} />;

  const site = await getSiteConfig();
  const layout = await getSetting<Record<string, boolean>>("home_layout", {});

  const [slides, promos, best, fresh, rated, brands, testimonials, posts] = await Promise.all([
    safe(() => db.heroSlide.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }), []),
    safe(() => db.promoBanner.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 2 }), []),
    safe(() => getRail("best", 10), [] as TCard[]),
    safe(() => getRail("new", 10), [] as TCard[]),
    safe(() => getRail("rating", 10), [] as TCard[]),
    safe(() => db.fabricBrand.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }), []),
    safe(() => db.testimonial.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }), []),
    safe(() => db.blogPost.findMany({ where: { isPublished: true }, orderBy: { publishedAt: "desc" }, take: 3 }), []),
  ]);

  const trendingTabs = await safe(
    () =>
      Promise.all(
        [
          { label: "All", slug: "catalogue" },
          { label: "Accessories", slug: "accessories" },
          { label: "Ethnic Wear", slug: "ethnic-wear" },
          { label: "Kurta", slug: "kurta" },
          { label: "Suit/Blazer", slug: "suit-blazer" },
        ].map(async (t) => ({ label: t.label, items: await trendingFor(t.slug) })),
      ),
    [] as { label: string; items: TCard[] }[],
  );

  const specThumbs = await safe(
    () =>
      Promise.all(
        (site.specializations ?? []).map(async (s) => {
          const cat = await db.category.findUnique({ where: { slug: s.slug }, select: { id: true } });
          const p = cat
            ? await db.product.findFirst({
                where: { categories: { some: { categoryId: cat.id } } },
                select: { images: { take: 1, select: { url: true } } },
              })
            : null;
          return { ...s, image: p?.images[0]?.url || "/img/placeholder.svg" };
        }),
      ),
    [] as { title: string; slug: string; image: string }[],
  );

  const orderCats = await safe(
    () =>
      Promise.all(
        (site.order_by_category ?? []).map(async (o) => {
          const leaf = o.slug.split("/").pop()!;
          const cat = await db.category.findUnique({ where: { slug: leaf }, select: { id: true } });
          const p = cat
            ? await db.product.findFirst({
                where: { categories: { some: { categoryId: cat.id } } },
                select: { images: { take: 1, select: { url: true } } },
              })
            : null;
          return { ...o, image: p?.images[0]?.url || "/img/placeholder.svg" };
        }),
      ),
    [] as { label: string; slug: string; image: string }[],
  );

  return (
    <div>
      {/* HERO + PROMOS */}
      <section className="container-cmt py-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <HeroCarousel slides={slides} />
          <div className="hidden grid-rows-2 gap-4 lg:grid">
            {promos.map((b) => (
              <a
                key={b.id}
                href={b.link || "#"}
                className="group relative block overflow-hidden rounded"
                aria-label={b.title || "promo"}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.imageUrl}
                  alt={b.title || "promo"}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORK */}
      {layout.show_how_it_works !== false && (site.how_it_works?.length ?? 0) > 0 && (
        <section className="bg-soft py-12">
          <div className="container-cmt">
            <h2 className="section-title">{site.section_titles?.[0] || "How It Work"}</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {site.how_it_works.map((s) => (
                <div key={s.step} className="relative rounded border border-line bg-white p-6 text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand text-xl font-extrabold text-white">
                    {s.step}
                  </div>
                  <h4 className="mt-4 text-sm font-bold uppercase">{s.title}</h4>
                  <p className="mt-1 text-xs uppercase text-faint">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* OUR SPECIALIZATION */}
      {layout.show_specialization !== false && specThumbs.length > 0 && (
        <section className="py-12">
          <div className="container-cmt">
            <h2 className="section-title">{site.section_titles?.[1] || "Our Specialization"}</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {specThumbs.map((s) => (
                <Link
                  key={s.slug}
                  href={`/${s.slug}`}
                  className="group relative overflow-hidden rounded border border-line"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.image}
                    alt={s.title}
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-brand-dark/80 p-3 text-center text-sm font-bold uppercase text-white">
                    {s.title} »
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ORDER BY CATEGORY */}
      {layout.show_order_by_category !== false && orderCats.length > 0 && (
        <section className="bg-soft py-12">
          <div className="container-cmt">
            <h2 className="section-title">{site.section_titles?.[2] || "Order by Category"}</h2>
            <div className="mt-8 grid grid-cols-3 gap-4 md:grid-cols-5 lg:grid-cols-9">
              {orderCats.map((o) => (
                <Link key={o.slug} href={`/${o.slug}`} className="group text-center">
                  <span className="block overflow-hidden rounded-full border-2 border-white shadow-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={o.image}
                      alt={o.label}
                      className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </span>
                  <span className="mt-2 block text-[11px] font-bold uppercase text-brand-dark group-hover:text-brand">
                    {o.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RAILS: bestsellers / new / rating */}
      {layout.show_rails !== false && (
        <section className="py-12">
          <div className="container-cmt">
            <ProductTabs
              tabs={[
                { label: site.product_rails?.[0] || "Best Sellers", items: best },
                { label: site.product_rails?.[1] || "New Arrivals", items: fresh },
                { label: site.product_rails?.[2] || "Most Rating", items: rated },
              ]}
            />
          </div>
        </section>
      )}

      {/* WHY CHOOSE US */}
      {layout.show_why_choose_us !== false && (site.why_choose_us?.length ?? 0) > 0 && (
        <section className="bg-brand-dark py-12 text-white">
          <div className="container-cmt">
            <h2 className="section-title !text-white">Why Choose Us</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {site.why_choose_us.map((w, i) => (
                <div key={i} className="flex items-start gap-4">
                  {w.icon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={w.icon} alt="" className="h-12 w-12 shrink-0 object-contain" />
                  )}
                  <div>
                    <h4 className="text-base font-bold text-white">{w.title}</h4>
                    <p className="text-sm text-white/70">{w.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TRENDING ITEMS */}
      {layout.show_trending !== false && (
        <section className="py-12">
          <div className="container-cmt">
            <h2 className="section-title">{site.section_titles?.[3] || "Trending Items"}</h2>
            <div className="mt-8">
              <ProductTabs tabs={trendingTabs} />
            </div>
          </div>
        </section>
      )}

      {/* MADE FOR YOU CTA */}
      {layout.show_made_cta !== false && site.made_cta && (
        <section className="bg-soft py-14">
          <div className="container-cmt flex flex-col items-center gap-4 text-center">
            <h2 className="text-2xl font-extrabold uppercase text-brand-dark md:text-3xl">
              {site.made_cta.title}
            </h2>
            <p className="max-w-2xl text-sm text-muted">{site.made_cta.text}</p>
            <a href={site.made_cta.link || site.booking_url} className="btn-brand mt-2">
              {site.made_cta.button || "Book Visit & Order Now"}
            </a>
          </div>
        </section>
      )}

      {/* FABRIC BRANDS */}
      {layout.show_fabric_brands !== false && brands.length > 0 && (
        <section className="py-12">
          <div className="container-cmt">
            <h2 className="section-title">Our Fabric&apos;s Branded</h2>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
              {brands.map((b) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={b.id}
                  src={b.logoUrl}
                  alt={b.name}
                  className="h-14 w-auto object-contain opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      {layout.show_testimonials !== false && testimonials.length > 0 && (
        <section className="bg-soft py-12">
          <div className="container-cmt">
            <h2 className="section-title">Testimonials</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.slice(0, 6).map((t) => (
                <figure key={t.id} className="rounded border border-line bg-white p-5">
                  <blockquote className="text-sm text-muted">“{t.text}”</blockquote>
                  <figcaption className="mt-3 text-sm">
                    <span className="font-bold text-brand-dark">{t.name}</span>
                    {t.role && <span className="block text-xs text-faint">{t.role}</span>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* STATS */}
      {layout.show_stats !== false && (site.stats?.length ?? 0) > 0 && (
        <section className="bg-brand-dark py-12">
          <div className="container-cmt grid grid-cols-2 gap-8 lg:grid-cols-4">
            {site.stats.map((s, i) => (
              <StatCounter key={i} value={s.value} label={s.label} />
            ))}
          </div>
        </section>
      )}

      {/* LATEST BLOG */}
      {layout.show_latest_blog !== false && posts.length > 0 && (
        <section className="py-12">
          <div className="container-cmt">
            <h2 className="section-title">Latest Blog</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
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
                  <div className="p-4">
                    <Link
                      href={`/blog/${p.slug}`}
                      className="line-clamp-2 text-sm font-bold text-brand-dark hover:text-brand"
                    >
                      {p.title}
                    </Link>
                    <p className="mt-2 line-clamp-3 text-xs text-muted">{p.excerpt}</p>
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
        </section>
      )}
    </div>
  );
}

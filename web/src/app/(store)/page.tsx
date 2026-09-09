import Link from "next/link";
import { getSiteConfig, getSetting } from "@/lib/settings";
import { dbStatus } from "@/lib/health";
import { getHomeData, type HomeData } from "@/lib/home-data";
import { SetupNotice } from "@/components/SetupNotice";
import { ProductCard } from "@/components/product/ProductCard";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { ProductTabs } from "@/components/home/ProductTabs";
import { StatCounter } from "@/components/home/StatCounter";
import { HowIcon, StepArrow } from "@/components/home/HowIcons";

export const dynamic = "force-dynamic";

const EMPTY_HOME: HomeData = {
  slides: [],
  promos: [],
  rails: { best: [], fresh: [], rated: [] },
  brands: [],
  testimonials: [],
  posts: [],
  trendingTabs: [],
  specThumbs: [],
  orderCats: [],
};

export default async function HomePage() {
  const status = await dbStatus();
  if (status !== "ok") return <SetupNotice status={status} />;

  const [site, layout, home] = await Promise.all([
    getSiteConfig(),
    getSetting<Record<string, boolean>>("home_layout", {}),
    getHomeData().catch(() => EMPTY_HOME),
  ]);
  const { slides, promos, brands, testimonials, posts, trendingTabs, specThumbs, orderCats } = home;
  const { best, fresh, rated } = home.rails;

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
        <section className="py-12">
          <div className="container-cmt">
            <h2 className="section-title section-title--left">
              {site.section_titles?.[0] || "How It Work"}
            </h2>
            <div className="mt-8 flex flex-col items-stretch gap-6 rounded-lg bg-soft px-6 py-8 md:flex-row md:items-center md:justify-between md:gap-2">
              {site.how_it_works.map((s, i) => (
                <div key={s.step} className="flex items-center gap-2 md:flex-1">
                  <div className="flex items-center gap-3">
                    <HowIcon step={s.step} className="h-12 w-12 shrink-0" />
                    <div className="leading-tight">
                      <p className="text-[13px] font-extrabold uppercase text-brand-dark">
                        {s.title}
                      </p>
                      <p className="text-[13px] uppercase text-ink/80">{s.text}</p>
                    </div>
                  </div>
                  {i < site.how_it_works.length - 1 && (
                    <span className="ml-auto">
                      <StepArrow />
                    </span>
                  )}
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
            <h2 className="section-title section-title--left">
              {site.section_titles?.[1] || "Our Specialization"}
            </h2>
            {(() => {
              const spanClass = [
                "md:col-start-1 md:row-start-1 md:row-span-2",
                "md:col-start-2 md:row-start-1",
                "md:col-start-2 md:row-start-2",
                "md:col-start-3 md:row-start-1 md:row-span-2",
              ];
              return (
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:grid-rows-2">
                  {specThumbs.slice(0, 4).map((s, i) => (
                    <Link
                      key={s.slug}
                      href={`/${s.slug}`}
                      className={`group relative block overflow-hidden rounded ${
                        spanClass[i] ?? ""
                      } ${i === 0 || i === 3 ? "min-h-[360px]" : "min-h-[220px]"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.image}
                        alt={s.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute inset-x-0 bottom-6 flex justify-center">
                        <span className="btn-brand !rounded !px-6 !py-2.5 !text-sm !normal-case shadow-lg">
                          {s.title} &gt;&gt;
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* ORDER BY CATEGORY */}
      {layout.show_order_by_category !== false && orderCats.length > 0 && (
        <section className="py-12">
          <div className="container-cmt">
            <div className="rounded-lg bg-soft p-6">
              <div className="section-head">
                <h2 className="text-brand-dark">
                  {site.section_titles?.[2] || "Order by Category"}
                </h2>
                <div className="flex items-center gap-2 text-lg text-faint">
                  <span>‹</span>
                  <span>›</span>
                </div>
              </div>
              <div className="no-scrollbar mt-6 flex gap-4 overflow-x-auto pb-2">
                {orderCats.map((o) => (
                  <Link
                    key={o.slug}
                    href={`/${o.slug}`}
                    className="group w-[42%] shrink-0 rounded bg-white p-3 text-center shadow-card sm:w-[30%] md:w-[22%] lg:w-[13.5%]"
                  >
                    <span className="relative mx-auto block aspect-square w-full overflow-hidden rounded-full ring-2 ring-brand ring-offset-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={o.image}
                        alt={o.label}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </span>
                    <span className="mt-3 block rounded bg-soft px-1 py-1.5 text-[11px] font-bold uppercase text-brand-dark group-hover:text-brand">
                      {o.label}
                    </span>
                  </Link>
                ))}
              </div>
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
        <section
          className="relative bg-cover bg-center py-16 text-white"
          style={{ backgroundImage: "url(/whychoose-bg.jpg)" }}
        >
          <div className="absolute inset-0 bg-black/45" />
          <div className="container-cmt relative">
            <h2 className="mb-10 text-center text-3xl font-bold text-white">Why Choose Us</h2>
            <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {site.why_choose_us.map((w, i) => (
                <div key={i} className="text-center">
                  {w.icon && (
                    <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={w.icon} alt="" className="h-8 w-8 object-contain" />
                    </span>
                  )}
                  <h3 className="mt-3 text-lg font-semibold text-white">{w.title}</h3>
                  <p className="mt-1 text-[13px] leading-snug text-white/85">{w.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TRENDING ITEMS */}
      {layout.show_trending !== false && trendingTabs.length > 0 && (
        <section className="py-12">
          <div className="container-cmt">
            <ProductTabs
              heading={site.section_titles?.[3] || "Trending Items"}
              tabs={trendingTabs}
            />
          </div>
        </section>
      )}

      {/* MADE FOR YOU CTA */}
      {layout.show_made_cta !== false && site.made_cta && (
        <section
          className="relative bg-cover bg-center"
          style={{ backgroundImage: "url(/made-bg.jpg)" }}
        >
          <div className="absolute inset-0 bg-black/55" />
          <div className="container-cmt relative flex flex-col items-start gap-6 py-16 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h2 className="font-script text-4xl leading-tight text-white md:text-5xl">
                {site.made_cta.title}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/90">
                {site.made_cta.text}
              </p>
            </div>
            <a
              href={site.made_cta.link || site.booking_url}
              className="btn-made shrink-0"
            >
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
        <section
          className="relative bg-cover bg-fixed bg-center py-14"
          style={{ backgroundImage: "url(/stats-bg.jpg)" }}
        >
          <div className="absolute inset-0 bg-black/55" />
          <div className="container-cmt relative grid grid-cols-2 gap-4 lg:grid-cols-4">
            {site.stats.map((s, i) => (
              <div key={i} className="border border-white/25 px-2 py-6">
                <StatCounter value={s.value} label={s.label} />
              </div>
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

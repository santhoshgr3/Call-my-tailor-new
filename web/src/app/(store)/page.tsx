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
import { BrandStrip } from "@/components/home/BrandStrip";
import { VideoTestimonials } from "@/components/home/VideoTestimonials";
import { VlogGrid } from "@/components/home/VlogGrid";
import { db } from "@/lib/db";

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

  const [site, layout, home, vlogs] = await Promise.all([
    getSiteConfig(),
    getSetting<Record<string, boolean>>("home_layout", {}),
    getHomeData().catch(() => EMPTY_HOME),
    db.vlog
      .findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { title: "asc" }], take: 12 })
      .catch(() => []),
  ]);
  const { slides, promos, brands, testimonials, trendingTabs, specThumbs, orderCats } = home;
  const { best, fresh, rated } = home.rails;
  const T = site.titles ?? {};
  const BG = site.backgrounds ?? {};
  const showHero = layout.show_hero !== false;

  // On phones the sections follow the order of the old mobile site (order-N); md: and up keep the desktop order.
  return (
    <div className="flex flex-col">
      {/* HERO + PROMOS */}
      <section className="container-cmt order-1 py-0 max-md:!px-0 md:py-5">
        <div className={showHero ? "grid gap-0 md:gap-4 lg:grid-cols-[1fr_360px]" : "grid gap-4"}>
          {showHero && <HeroCarousel slides={slides} />}
          <div className="grid grid-cols-2 gap-2 px-2 pt-2 md:grid-cols-2 md:gap-3 md:px-0 md:pt-0 lg:grid-cols-1 lg:grid-rows-2 lg:gap-4">
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
        <section className="order-10 py-7 md:order-2">
          <div className="container-cmt">
            <h2 className="section-title section-title--left">
              {T.how_it_works || site.section_titles?.[0] || "How It Work"}
            </h2>
            <div className="mt-5 rounded-lg bg-soft px-4 py-2 md:flex md:flex-row md:items-center md:justify-between md:gap-2 md:px-5 md:py-5">
              {site.how_it_works.map((s, i) => (
                <div key={s.step} className="relative flex items-center gap-2 md:flex-1">
                  {i < site.how_it_works.length - 1 && (
                    <span aria-hidden className="absolute left-[13px] top-1/2 h-full w-px bg-ink/60 md:hidden" />
                  )}
                  <div className="flex items-center gap-3 py-3.5 md:py-0">
                    <span className="relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-ink bg-soft text-xs font-semibold text-ink md:hidden">
                      {i + 1}
                    </span>
                    {s.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.icon} alt="" className="h-9 w-auto shrink-0 object-contain md:h-14 md:w-14" />
                    ) : (
                      <HowIcon step={s.step} className="h-9 w-9 shrink-0 md:h-14 md:w-14" />
                    )}
                    <div className="leading-tight">
                      <p className="text-[13px] font-extrabold uppercase text-brand-dark">{s.title}</p>
                      <p className="text-[12px] uppercase text-ink/80 md:text-[13px]">{s.text}</p>
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
        <section className="order-5 py-7 md:order-3">
          <div className="container-cmt">
            <h2 className="section-title section-title--left">
              {T.specialization || site.section_titles?.[1] || "Our Specialization"}
            </h2>
            {(() => {
              const spanClass = [
                "md:col-start-1 md:row-start-1 md:row-span-2",
                "md:col-start-2 md:row-start-1",
                "md:col-start-2 md:row-start-2",
                "md:col-start-3 md:row-start-1 md:row-span-2",
              ];
              return (
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:grid-rows-2">
                  {specThumbs.slice(0, 4).map((s, i) => (
                    <Link
                      key={s.slug}
                      href={`/${s.slug}`}
                      className={`group relative block overflow-hidden rounded ${
                        spanClass[i] ?? ""
                      } ${i === 0 || i === 3 ? "min-h-[340px] md:min-h-[500px]" : "min-h-[240px] md:min-h-[242px]"}`}
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
        <section className="order-2 py-7 md:order-4">
          <div className="container-cmt">
            <div className="rounded-lg bg-soft p-4">
              <div className="section-head">
                <h2 className="text-brand-dark">
                  {T.order_by_category || site.section_titles?.[2] || "Order by Category"}
                </h2>
                <div className="flex items-center gap-2 text-lg text-faint">
                  <span>‹</span>
                  <span>›</span>
                </div>
              </div>
              <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-1">
                {orderCats.map((o) => (
                  <Link
                    key={o.slug}
                    href={`/${o.slug}`}
                    className="group w-[44%] shrink-0 border border-line bg-white text-center sm:w-[31%] md:w-[23%] lg:w-[13.6%]"
                  >
                    <span className="relative block aspect-[3/4] w-full overflow-hidden bg-soft">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={o.image}
                        alt={o.label}
                        className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      />
                    </span>
                    <span className="block border-t border-line bg-soft px-1 py-2 text-[12px] font-semibold uppercase text-ink group-hover:text-brand">
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
        <section className="order-6 py-7 md:order-5">
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
          className="relative order-7 bg-cover bg-center py-10 text-white md:order-6"
          style={{ backgroundImage: `url(${BG.why_choose || "/whychoose-bg.jpg"})` }}
        >
          <div className="absolute inset-0 bg-black/45" />
          <div className="container-cmt relative">
            <h2 className="mb-6 text-center text-xl font-bold text-white sm:mb-10 sm:text-2xl">
              {T.why_choose_us || "Why Choose Us"}
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:gap-x-8 sm:gap-y-10 lg:grid-cols-3">
              {site.why_choose_us.map((w, i) => (
                <div key={i} className="text-center">
                  {w.icon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={w.icon} alt="" className="mx-auto h-[56px] w-[56px] object-contain sm:h-[70px] sm:w-[70px]" />
                  )}
                  <h3 className="mt-2 text-[15px] font-semibold text-white sm:mt-3 sm:text-lg">{w.title}</h3>
                  <p className="mt-1 text-[12px] leading-snug text-white/85 sm:text-[13px]">{w.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TRENDING ITEMS */}
      {layout.show_trending !== false && trendingTabs.length > 0 && (
        <section className="order-3 py-7 md:order-7">
          <div className="container-cmt">
            <ProductTabs
              heading={T.trending || site.section_titles?.[3] || "Trending Items"}
              tabs={trendingTabs}
            />
          </div>
        </section>
      )}

      {/* MADE FOR YOU CTA */}
      {layout.show_made_cta !== false && site.made_cta && (
        <section
          className="relative order-4 bg-cover bg-center md:order-8"
          style={{ backgroundImage: `url(${BG.made || "/made-bg.jpg"})` }}
        >
          <div className="absolute inset-0 bg-black/55" />
          <div className="container-cmt relative flex flex-col items-start gap-6 py-10 md:flex-row md:items-center md:justify-between">
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
        <section className="order-12 py-7 md:order-9">
          <div className="container-cmt">
            <h2 className="mb-4 text-2xl font-bold uppercase text-brand-dark">
              {T.fabric_brands || "Our Fabric's Branded"}
            </h2>
            <BrandStrip brands={brands} bg={BG.fabric} />
          </div>
        </section>
      )}

      {/* STATS */}
      {layout.show_stats !== false && (site.stats?.length ?? 0) > 0 && (
        <section
          className="relative order-9 bg-cover bg-center py-9 md:order-10 md:bg-fixed"
          style={{ backgroundImage: `url(${BG.stats || "/stats-bg.jpg"})` }}
        >
          <div className="absolute inset-0 bg-black/55" />
          <div className="container-cmt relative grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {site.stats.map((s, i) => (
              <div key={i} className="border border-white/25 px-2 py-6">
                <StatCounter value={s.value} label={s.label} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TESTIMONIALS (video) */}
      {layout.show_testimonials !== false &&
        (() => {
          const videoTestimonials = testimonials.filter(
            (t): t is typeof t & { videoUrl: string } => !!t.videoUrl,
          );
          if (videoTestimonials.length === 0) return null;
          return (
            <section className="order-8 py-7 md:order-11">
              <div className="container-cmt">
                <h2 className="section-title">{T.testimonials || "Testimonials"}</h2>
                <div className="mt-5">
                  <VideoTestimonials items={videoTestimonials} />
                </div>
              </div>
            </section>
          );
        })()}

      {/* VLOGS (YouTube) */}
      {layout.show_vlogs !== false && vlogs.length > 0 && (
        <section className="order-8 bg-soft py-8 md:order-12">
          <div className="container-cmt">
            <h2 className="section-title">{T.vlog || "Vlog"}</h2>
            <div className="mt-5">
              <VlogGrid items={vlogs} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

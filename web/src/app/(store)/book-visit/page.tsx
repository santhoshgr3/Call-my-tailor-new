import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSiteConfig, resolveBooking } from "@/lib/settings";
import { VideoTestimonials } from "@/components/home/VideoTestimonials";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Book a Home Visit",
  description:
    "Book a doorstep visit. Our tailor comes to your home, takes measurements and helps you pick from 2000+ fabrics.",
};

export default async function BookVisitPage() {
  const site = await getSiteConfig();
  const cfg = resolveBooking(site);
  const testimonials = await db.testimonial
    .findMany({
      where: { isActive: true, videoUrl: { not: null } },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, role: true, videoUrl: true },
    })
    .catch(() => []);
  const videos = testimonials.flatMap((t) => (t.videoUrl ? [{ ...t, videoUrl: t.videoUrl }] : []));
  const whatsapp = (site.contact?.whatsapp || "918882222900").replace(/\D/g, "");

  return (
    <main>
      {/* ── Hero ── */}
      <section className="relative flex min-h-[560px] items-stretch overflow-hidden bg-[#0d1525] md:min-h-[640px]">
        <div
          className="absolute inset-0 bg-cover bg-right bg-no-repeat sm:bg-center"
          style={{ backgroundImage: `url('${cfg.hero_image}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d1525]/95 via-[#0d1525]/75 to-[#0d1525]/30 sm:to-[#0d1525]/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1525]/60 via-transparent to-transparent" />
        <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-brand to-transparent opacity-60" />

        <div className="container-cmt relative z-10 flex items-center py-14">
          <div className="max-w-2xl">
            <div className="mb-6 flex items-center gap-3">
              <span className="block h-px w-8 bg-brand" />
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand">{cfg.eyebrow}</p>
            </div>
            <h1
              className="mb-3 font-extrabold leading-[1.1] text-white"
              style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)" }}
            >
              {cfg.title_line1} <span className="italic text-brand">{cfg.title_accent}</span>
            </h1>
            <p className="mb-4 text-lg font-medium text-white/90 md:text-xl">{cfg.subtitle}</p>
            <div className="mb-5 flex items-center gap-3">
              <span className="block h-px max-w-[60px] flex-1 bg-brand/50" />
              <span className="text-sm text-brand">✦</span>
              <span className="block h-px max-w-[60px] flex-1 bg-brand/50" />
            </div>
            <p className="mb-10 max-w-lg text-base font-light leading-relaxed text-white/70 md:text-lg">{cfg.body}</p>

            <div className="mb-12 flex flex-col flex-wrap gap-4 sm:flex-row">
              <a
                href="#select-category"
                className="flex w-full items-center justify-center gap-2 bg-brand px-8 py-3.5 text-sm font-semibold uppercase tracking-widest text-white shadow-lg transition-colors hover:bg-brand-hover sm:w-auto"
                style={{ clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 100%, 12px 100%)" }}
              >
                📅 {cfg.cta_label}
              </a>
              <a
                href={`https://api.whatsapp.com/send?phone=${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 border border-white/30 px-7 py-3.5 text-sm font-semibold uppercase tracking-widest text-white/80 transition-colors hover:border-brand hover:text-brand sm:w-auto"
              >
                WhatsApp Us
              </a>
            </div>

            <div className="flex flex-wrap gap-8 border-t border-white/10 pt-8">
              {cfg.stats.map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-extrabold leading-none text-brand">{s.value}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-widest text-white/45">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Choose a category ── */}
      <section id="select-category" className="scroll-mt-4 bg-[#faf8f5] py-16 md:py-20">
        <div className="container-cmt">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#1a2744] md:text-4xl">{cfg.select_heading}</h2>
            <p className="mt-3 text-base text-muted">{cfg.select_intro}</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="block h-px w-12 bg-brand/40" />
              <span className="text-xs text-brand">✦</span>
              <span className="block h-px w-12 bg-brand/40" />
            </div>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-3">
            {cfg.categories.map((c) => (
              <Link key={c.slug} href={`/book-visit/${c.slug}`} className="group relative block overflow-hidden text-left">
                <div className="h-[280px] overflow-hidden sm:h-[320px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.image}
                    alt={c.label}
                    className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d1525]/90 via-[#0d1525]/30 to-transparent" />
                <div className="absolute left-4 top-4 h-6 w-6 border-l-2 border-t-2 border-brand opacity-70 transition-opacity group-hover:opacity-100" />
                <div className="absolute right-4 top-4 h-6 w-6 border-r-2 border-t-2 border-brand opacity-70 transition-opacity group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <p className="mb-1 text-2xl font-extrabold leading-none tracking-wide text-white">{c.label}</p>
                  <p className="mb-4 text-xs tracking-wide text-white/60">{c.desc}</p>
                  <span className="inline-flex items-center gap-2 bg-brand px-5 py-2 text-xs font-bold uppercase tracking-widest text-white transition-colors group-hover:bg-brand-hover">
                    Explore ›
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="bg-[#1a2744] py-12">
        <div className="container-cmt">
          <div className="grid grid-cols-2 gap-8 text-center sm:grid-cols-4">
            {cfg.stats.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-extrabold leading-none text-brand md:text-4xl">{s.value}</p>
                <p className="mt-2 text-xs uppercase tracking-widest text-white/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-white py-16">
        <div className="container-cmt">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#1a2744]">How it works</h2>
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="block h-px w-12 bg-brand/40" />
              <span className="text-xs text-brand">✦</span>
              <span className="block h-px w-12 bg-brand/40" />
            </div>
          </div>
          <div className="relative grid grid-cols-2 gap-y-10 sm:grid-cols-4">
            <div className="absolute left-[12.5%] right-[12.5%] top-10 hidden h-px bg-brand/20 sm:block" />
            {cfg.steps.map((s, i) => (
              <div key={s.title} className="relative flex flex-col items-center px-4 text-center sm:px-8">
                <div className="relative mb-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-brand/30 bg-[#f8f4ee] shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.image} alt="" className="h-10 w-10 object-contain" />
                  </div>
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mb-2 text-sm font-bold uppercase tracking-widest text-[#1a2744]">{s.title}</h3>
                <p className="max-w-[160px] text-xs leading-relaxed text-faint">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      {videos.length > 0 && (
        <section className="bg-[#faf8f5] py-14">
          <div className="container-cmt">
            <h2 className="section-title mb-8">Testimonials</h2>
            <VideoTestimonials items={videos} />
          </div>
        </section>
      )}

      {/* ── Features strip ── */}
      <section className="bg-[#1a2744] py-14">
        <div className="container-cmt">
          <div className="mx-auto mb-10 h-px w-16 bg-brand opacity-60" />
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
            {cfg.features.map((f) => (
              <div key={f.title} className="group text-center">
                <div className="mb-3 text-3xl transition-transform duration-300 group-hover:scale-110">{f.icon}</div>
                <p className="text-sm font-semibold tracking-wide text-white">{f.title}</p>
                <p className="mt-1 text-xs text-white/40">{f.sub}</p>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-10 h-px w-16 bg-brand opacity-60" />
        </div>
      </section>
    </main>
  );
}

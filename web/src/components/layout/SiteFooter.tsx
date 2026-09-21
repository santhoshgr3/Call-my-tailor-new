import Link from "next/link";
import type { SiteConfig } from "@/lib/settings";
import { NewsletterForm } from "./NewsletterForm";
import { SocialIcons } from "./SocialIcons";

function FooterLinkList({ links }: { links: { text: string; href: string }[] }) {
  return (
    <ul className="space-y-2 text-sm">
      {links.map((l) => (
        <li key={l.href + l.text}>
          <Link href={l.href} className="flex items-center gap-2 text-white/75 hover:text-brand">
            <span className="text-[10px] text-white/40">⊙</span>
            {l.text}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function SiteFooter({ site }: { site: SiteConfig }) {
  const columns = site.footer_columns?.length
    ? site.footer_columns
    : [{ title: "Information", links: site.footer_information_links ?? [] }];
  const gallery = site.footer_gallery ?? [];
  const more = site.footer_gallery_more;
  const tags = site.footer_tags ?? [];
  const videoId = (site.footer_video ?? "").match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)?.[1];

  return (
    <footer className="mt-16 bg-brand-dark text-white/80">
      {/* newsletter */}
      <div className="border-b border-white/10">
        <div className="container-cmt flex flex-col items-center justify-between gap-5 py-6 lg:flex-row">
          <div className="flex items-center gap-4">
            <span className="text-2xl text-white">➤</span>
            <div>
              <h4 className="text-lg font-bold text-white">
                {site.newsletter_heading || "Signup For Newsletter"}
              </h4>
              <p className="text-sm text-white/50">
                We&apos;ll never share your email address with a third-party.
              </p>
            </div>
          </div>
          <NewsletterForm />
          <div className="flex items-center gap-3 text-sm text-white/70">
            <SocialIcons socials={site.socials ?? {}} variant="light" withSeparators />
          </div>
        </div>
      </div>

      {/* main columns */}
      <div className="container-cmt grid gap-8 py-10 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1.3fr]">
        {/* video */}
        <div>
          {videoId ? (
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-video w-full overflow-hidden rounded"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                alt="Call My Tailor video"
                className="h-full w-full object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/40">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-brand text-lg text-white shadow-lg transition-transform group-hover:scale-110">
                  ▶
                </span>
              </span>
            </a>
          ) : (
            <div className="rounded bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={site.logo || "/logo.png"} alt="Call My Tailor" width={200} height={71} className="h-10 w-auto" />
            </div>
          )}
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h5 className="relative mb-4 pb-2 text-sm font-bold uppercase text-white after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-8 after:bg-brand">
              {col.title}
            </h5>
            <FooterLinkList links={col.links} />
          </div>
        ))}

        {/* instagram gallery */}
        {gallery.length > 0 && (
          <div>
            <h5 className="relative mb-4 pb-2 text-sm font-bold uppercase text-white after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-8 after:bg-brand">
              Instagram Gallery
            </h5>
            <div className="grid grid-cols-3 gap-1.5">
              {gallery.slice(0, 5).map((g, i) => (
                <a
                  key={i}
                  href={g.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-square overflow-hidden rounded"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.image} alt="" className="h-full w-full object-cover transition-transform hover:scale-110" />
                </a>
              ))}
              {more && (
                <a
                  href={more.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block aspect-square overflow-hidden rounded"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={more.image} alt="More on Instagram" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-bold text-white">
                    More
                  </span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* bottom category tag strip */}
      {tags.length > 0 && (
        <div className="border-t border-white/10">
          <div className="container-cmt flex flex-wrap items-center gap-x-2 gap-y-1 py-4 text-xs text-white/50">
            {tags.map((t, i) => (
              <span key={t.href + t.text} className="flex items-center gap-2">
                <Link href={t.href} className="hover:text-brand">
                  {t.text}
                </Link>
                {i < tags.length - 1 && <span className="text-white/25">|</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        {site.copyright || `Callmytailor © ${new Date().getFullYear()} All Rights Reserved.`}
      </div>
    </footer>
  );
}

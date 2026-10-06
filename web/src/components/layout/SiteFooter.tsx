import Link from "next/link";
import { DEFAULT_PAGE_TEXT, type SiteConfig } from "@/lib/settings";
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
      {/* WhatsApp channel banner */}
      {site.whatsapp_channel?.enabled !== false && (
        <div className="border-b border-white/10 bg-[#2b2b2b]">
          <div className="container-cmt flex flex-col items-center justify-between gap-4 py-6 text-center sm:flex-row sm:text-left">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <svg viewBox="0 0 24 24" className="h-14 w-14 shrink-0 text-white" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
                <path d="M12 3a9 9 0 00-7.7 13.6L3 21l4.5-1.2A9 9 0 1012 3z" strokeLinejoin="round" />
                <path d="M8.8 8.2c.3-.6.8-.5 1-.3l.9 1.5c.1.3 0 .5-.2.7l-.5.6c.6 1.1 1.4 1.9 2.6 2.5l.6-.6c.2-.2.5-.3.7-.1l1.4.8c.3.2.3.7 0 1.1-.6.8-1.5 1-2.6.6-2.2-.8-4-2.5-4.9-4.7-.2-.6.2-1.600 1-2.100z" fill="currentColor" stroke="none" />
              </svg>
              <div>
                <h4 className="text-2xl font-bold text-white">
                  {site.whatsapp_channel?.heading || "Join Our Whatsapp Channel"}
                </h4>
                <p className="mt-0.5 text-base text-white/80">
                  {site.whatsapp_channel?.text || "We will share you latest collection and update"}
                </p>
              </div>
            </div>
            <a
              href={
                site.whatsapp_channel?.url ||
                `https://api.whatsapp.com/send?phone=${(site.contact?.whatsapp || "918882222900").replace(/\D/g, "")}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-[170px] items-center justify-center bg-brand px-8 py-3 text-lg font-bold text-white transition-colors hover:bg-brand-hover"
            >
              {site.whatsapp_channel?.button || "Follow Us"}
            </a>
          </div>
        </div>
      )}

      {/* social links (the newsletter signup was removed) */}
      <div className="border-b border-white/10">
        <div className="container-cmt flex items-center justify-center py-4 text-sm text-white/70">
          <SocialIcons socials={site.socials ?? {}} variant="light" withSeparators />
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
              {site.page_text?.gallery_heading || DEFAULT_PAGE_TEXT.gallery_heading}
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

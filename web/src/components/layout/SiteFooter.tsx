import Link from "next/link";
import type { SiteConfig } from "@/lib/settings";
import { NewsletterForm } from "./NewsletterForm";

export function SiteFooter({ site }: { site: SiteConfig }) {
  const c = site.contact ?? ({} as SiteConfig["contact"]);
  const info = site.footer_information_links as { text: string; href: string }[] | undefined;
  return (
    <footer className="mt-16 bg-brand-dark text-white/80">
      {/* newsletter */}
      <div className="border-b border-white/10">
        <div className="container-cmt flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
          <div>
            <h4 className="text-lg font-bold text-white">Signup for Newsletter</h4>
            <p className="text-sm text-white/60">
              We&apos;ll never share your email address with a third-party.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </div>

      <div className="container-cmt grid gap-8 py-10 md:grid-cols-4">
        <div>
          <span className="block text-xl font-extrabold uppercase text-white">
            Call<span className="text-brand">My</span>Tailor
          </span>
          <p className="mt-3 text-sm leading-relaxed">{c.address}</p>
          <p className="mt-3 text-sm">
            <span className="font-semibold text-white">Phone:</span> {c.phone}
          </p>
          <p className="text-sm">
            <span className="font-semibold text-white">Email:</span> {c.email}
          </p>
          <p className="mt-2 text-xs text-white/50">{c.hours}</p>
        </div>

        <div>
          <h5 className="mb-3 text-sm font-bold uppercase text-white">Information</h5>
          <ul className="space-y-1.5 text-sm">
            {(info ?? []).map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-brand">
                  {l.text}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h5 className="mb-3 text-sm font-bold uppercase text-white">Shop</h5>
          <ul className="space-y-1.5 text-sm">
            {(site.order_by_category ?? []).map((o) => (
              <li key={o.slug}>
                <Link href={`/${o.slug}`} className="hover:text-brand">
                  {o.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h5 className="mb-3 text-sm font-bold uppercase text-white">Get in touch</h5>
          <ul className="space-y-1.5 text-sm">
            {Object.entries(site.socials ?? {}).map(([k, v]) => (
              <li key={k}>
                <a href={v} target="_blank" rel="noopener noreferrer" className="capitalize hover:text-brand">
                  {k}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {(site.payment_partners ?? []).map((p) => (
              <span key={p} className="rounded bg-white/10 px-2 py-1 text-[11px] text-white/70">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Call My Tailor. All rights reserved. · A demo rebuild for
        development purposes.
      </div>
    </footer>
  );
}

import type { ReactNode } from "react";
import { scopeCss, splitLegacyHtml } from "@/lib/legacy-css";
import { LegacyEnhance } from "./LegacyEnhance";
import { LegacySlots } from "./LegacySlots";
import { LEGACY_THEME_CSS } from "@/lib/legacy-theme-css";

const THEME_SCOPED = scopeCss(LEGACY_THEME_CSS, ".legacy-page");

/** Wrapper that gives children the old site's look: theme CSS + the page's own CSS, both scoped under .legacy-page. */
export function LegacyShell({ css, children }: { css?: string; children: ReactNode }) {
  return (
    <div className="legacy-page">
      <style dangerouslySetInnerHTML={{ __html: THEME_SCOPED }} />
      {css ? <style dangerouslySetInnerHTML={{ __html: scopeCss(css, ".legacy-page") }} /> : null}
      <div className="item-article">{children}</div>
      <LegacyEnhance />
    </div>
  );
}

/**
 * Renders an imported old-site page. `slots` maps an element id inside the stored HTML to a live React
 * component (e.g. a working contact form) that is mounted into that placeholder.
 */
export function LegacyPage({ html, slots }: { html: string; slots?: Record<string, ReactNode> }) {
  const { css, body } = splitLegacyHtml(html);
  return (
    <LegacyShell css={css}>
      <div dangerouslySetInnerHTML={{ __html: body }} />
      {slots ? <LegacySlots slots={slots} /> : null}
    </LegacyShell>
  );
}

export const isLegacyHtml = (html: string) => /<style[\s>]/i.test(html) || html.includes("<!--legacy-->");

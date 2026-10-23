import type { ReactNode } from "react";
import { scopeCss, splitLegacyHtml } from "@/lib/legacy-css";
import { LegacyEnhance } from "./LegacyEnhance";
import { LegacySlots } from "./LegacySlots";
import { LEGACY_CSS_VERSION } from "@/lib/legacy-css-version";

/** Wrapper that gives children the old site's look: theme CSS + the page's own CSS, both scoped under .legacy-page. */
export function LegacyShell({ css, children }: { css?: string; children: ReactNode }) {
  return (
    <div className="legacy-page layout-2">
      <link rel="stylesheet" href={`/legacy-theme.css?v=${LEGACY_CSS_VERSION}`} precedence="legacy" />
      <link rel="stylesheet" href={`/legacy-mobile.css?v=${LEGACY_CSS_VERSION}`} precedence="legacy" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" precedence="legacy" />
      {css ? <style dangerouslySetInnerHTML={{ __html: scopeCss(css, ".legacy-page") }} /> : null}
      {/* same nesting as the old theme: page container > row > #content column */}
      <div className="container">
        <div className="row">
          <div id="content" className="col-sm-12 item-article">
            {children}
          </div>
        </div>
      </div>
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

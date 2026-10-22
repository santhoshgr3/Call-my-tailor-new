import { scopeCss, splitLegacyHtml } from "@/lib/legacy-css";
import { LegacyEnhance } from "./LegacyEnhance";

/** Renders an imported old-site page: its own CSS scoped under .legacy-page, plus the Bootstrap-style layer in globals.css. */
export function LegacyPage({ html }: { html: string }) {
  const { css, body } = splitLegacyHtml(html);
  return (
    <div className="legacy-page">
      {css && <style dangerouslySetInnerHTML={{ __html: scopeCss(css, ".legacy-page") }} />}
      <div dangerouslySetInnerHTML={{ __html: body }} />
      <LegacyEnhance />
    </div>
  );
}

export const isLegacyHtml = (html: string) => /<style[\s>]/i.test(html);

/**
 * Pages imported from the old site carry their own <style> blocks (written for the old theme).
 * Scope every selector under a wrapper class so those rules can't leak into the rest of the site.
 */
export function scopeCss(css: string, scope: string): string {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let i = 0;
  let out = "";

  const skipWs = () => {
    while (i < src.length && /\s/.test(src[i])) i++;
  };
  const readBlock = () => {
    // at src[i] === "{": returns the inner text and moves past the matching "}"
    let depth = 0;
    const start = i + 1;
    for (; i < src.length; i++) {
      if (src[i] === "{") depth++;
      else if (src[i] === "}") {
        depth--;
        if (depth === 0) {
          const inner = src.slice(start, i);
          i++;
          return inner;
        }
      }
    }
    return src.slice(start);
  };
  const scopeSelector = (sel: string) =>
    sel
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        if (/^(html|body|:root)$/i.test(s)) return scope;
        // body.layout-2 .x  ->  .legacy-page.layout-2 .x  (keeps the old specificity)
        const root = s.match(/^(?:html|body)((?:\.[A-Za-z0-9_-]+)*)(\s.*)?$/i);
        if (root) return `${scope}${root[1]}${root[2] ?? ""}`;
        return `${scope} ${s}`;
      })
      .join(", ");

  while (i < src.length) {
    skipWs();
    if (i >= src.length) break;
    const headStart = i;
    while (i < src.length && src[i] !== "{" && src[i] !== ";") i++;
    const head = src.slice(headStart, i).trim();
    if (src[i] === ";") {
      i++;
      if (/^@(import|charset)/i.test(head)) continue; // never pull other stylesheets in
      out += head + ";\n";
      continue;
    }
    if (i >= src.length) break;
    const inner = readBlock();
    if (/^@(media|supports|document)/i.test(head)) {
      out += `${head}{\n${scopeCss(inner, scope)}}\n`;
    } else if (/^@/.test(head)) {
      out += `${head}{${inner}}\n`; // @font-face, @keyframes … kept as-is
    } else if (head) {
      // the old theme's own fonts win over a page-level `body { font-family }`; keep the site font
      const isRoot = /^(html|body|:root)$/i.test(head.trim());
      const decls = isRoot ? inner.replace(/font-family\s*:[^;}]*;?/gi, "") : inner;
      out += `${scopeSelector(head)}{${decls}}\n`;
    }
  }
  return out;
}

/** Splits <style> blocks out of stored page HTML. */
export function splitLegacyHtml(html: string): { css: string; body: string } {
  const blocks: string[] = [];
  const body = html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_m, c: string) => {
    blocks.push(c);
    return "";
  });
  return { css: blocks.join("\n"), body: body.replace(/<script[\s\S]*?<\/script>/gi, "") };
}

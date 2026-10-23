// Builds public/legacy-theme.css: the old site's real theme CSS (Bootstrap 3, theme, custom), reduced to the rules
// that can match the imported pages, then scoped under .legacy-page.
//   node --experimental-strip-types scripts/gen-legacy-css.mjs <dir-with-old-css-and-html>
// <dir> must contain: t_bootstrap.css t_lib.css t_ie9-and-up.css custom.css t_shortcodes.css t_yellow.css t_responsive.css and content/*.html
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { scopeCss } from "../src/lib/legacy-css.ts";

const dir = process.argv[2];
if (!dir) throw new Error("pass the source directory");

// bootstrap/grid files are shared; the desktop theme (custom, yellow, responsive) only applies from 768px up,
// below that the old site served its separate mobile theme (see the phone layer further down)
const COMMON = ["t_bootstrap.css", "t_lib.css", "t_shortcodes.css", "t_widegrid.css"];
const DESKTOP = ["t_ie9-and-up.css", "custom.css", "t_yellow.css", "t_responsive.css"];

// classes / ids that appear in the pages (plus the few our own components add)
const used = new Set(["nav", "nav-pills", "nav-tabs", "tab-pane", "tab-content", "active", "in", "fade", "open", "item-article", "row", "container", "container-fluid", "clearfix", "legacy-page", "layout-2"]);
const usedIds = new Set(["content", "menu", "menu1", "menu2", "menu3", "menu4", "home"]);
for (const f of readdirSync(`${dir}/content`)) {
  const html = readFileSync(`${dir}/content/${f}`, "utf8");
  for (const m of html.matchAll(/class="([^"]*)"/g)) m[1].split(/\s+/).forEach((c) => c && used.add(c));
  for (const m of html.matchAll(/\sid="([^"]*)"/g)) usedIds.add(m[1]);
  // class names that appear inside page <style> blocks
}

// the old page's <body class="layout-2 …"> and #wrapper.wrapper-fluid are represented by .legacy-page itself
// the old page's <body class="layout-2 ltr …"> and #wrapper.wrapper-fluid are one element for us: .legacy-page.layout-2
const normalize = (sel) =>
  sel
    .replace(/body((?:\.(?:ltr|information-information|mobilelayout-1|loaded))+)/g, "body")
    .replace(/\.wrapper-fluid(?![A-Za-z0-9_-])\s*/g, "body.layout-2 ")
    .replace(/#wrapper(?![A-Za-z0-9_-])\s*/g, "body.layout-2 ")
    .replace(/^\.layout-2(?![A-Za-z0-9_-])\s*/, "body.layout-2 ")
    .replace(/\s+/g, " ")
    .trim();

function keepSelector(sel) {
  const cls = [...sel.matchAll(/\.(-?[A-Za-z_][A-Za-z0-9_-]*)/g)].map((m) => m[1]);
  const ids = [...sel.matchAll(/#(-?[A-Za-z_][A-Za-z0-9_-]*)/g)].map((m) => m[1]);
  return cls.every((c) => used.has(c)) && ids.every((i) => usedIds.has(i));
}

function filter(css) {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let i = 0, out = "";
  const ws = () => { while (i < src.length && /\s/.test(src[i])) i++; };
  const block = () => {
    let d = 0; const st = i + 1;
    for (; i < src.length; i++) {
      if (src[i] === "{") d++;
      else if (src[i] === "}") { d--; if (d === 0) { const inner = src.slice(st, i); i++; return inner; } }
    }
    return src.slice(st);
  };
  while (i < src.length) {
    ws(); if (i >= src.length) break;
    const hs = i;
    while (i < src.length && src[i] !== "{" && src[i] !== ";") i++;
    const head = src.slice(hs, i).trim();
    if (src[i] === ";") { i++; continue; } // @import / @charset: dropped
    if (i >= src.length) break;
    const inner = block();
    if (/^@(media|supports)/i.test(head)) {
      const f = filter(inner);
      if (f.trim()) out += `${head}{\n${f}}\n`;
    } else if (/^@/.test(head)) {
      continue; // @font-face, @keyframes, @-ms-viewport …
    } else {
      const kept = head.split(",").map((s) => normalize(s.trim())).filter((s) => s && keepSelector(s));
      if (kept.length) out += `${kept.join(",")}{${inner}}\n`;
    }
  }
  return out;
}

const NL = String.fromCharCode(10);
let common = "";
for (const f of COMMON) {
  const part = filter(readFileSync(`${dir}/${f}`, "utf8"));
  console.log(f, part.length);
  common += "/* " + f + " */" + NL + part + NL;
}
let desktop = "";
for (const f of DESKTOP) {
  const part = filter(readFileSync(`${dir}/${f}`, "utf8"));
  console.log(f, part.length);
  desktop += "/* " + f + " */" + NL + part + NL;
}
const all = common + NL + "@media (min-width: 768px) {" + NL + desktop + "}" + NL;
const scoped = scopeCss(all, ".legacy-page");
writeFileSync(new URL("../public/legacy-theme.css", import.meta.url), scoped);
// phone layer: the old site served a separate mobile theme (so-mobile) to phones; apply it below 768px
let mobile = "";
for (const f of ["m_ratchet.css", "m_blue.css", "m-inline.css"]) {
  const part = filter(readFileSync(`${dir}/${f}`, "utf8"));
  console.log(f, part.length);
  mobile += part + "\n";
}
const mobileScoped = `@media (max-width: 767px) {\n${scopeCss(mobile, ".legacy-page")}}\n`;
writeFileSync(new URL("../public/legacy-mobile.css", import.meta.url), mobileScoped);
const hash = createHash("sha1").update(scoped + mobileScoped).digest("hex").slice(0, 10);
writeFileSync(new URL("../src/lib/legacy-css-version.ts", import.meta.url), `// generated by scripts/gen-legacy-css.mjs\nexport const LEGACY_CSS_VERSION = "${hash}";\n`);
console.log("classes:", used.size, "ids:", usedIds.size, "bytes:", scoped.length);

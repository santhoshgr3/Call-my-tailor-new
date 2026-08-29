import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { load } from "./lib.mjs";

const OUT = path.resolve(process.cwd(), "../web/public/img");
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const IMG_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  Referer: "https://callmytailor.com/",
};

// Build candidate source URLs for an OpenCart image URL.
function candidates(u) {
  const set = [];
  set.push(u);
  // image/cache/catalog/foo-270x270.jpg  ->  image/catalog/foo.jpg  (the original upload)
  const m = u.match(/^(https?:\/\/[^/]+)\/image\/cache\/(.+?)(-\d+x\d+)?(\.\w+)$/i);
  if (m) {
    set.push(`${m[1]}/image/${m[2]}${m[4]}`); // original, no cache, no dims
    set.push(`${m[1]}/image/cache/${m[2]}-270x270${m[4]}`); // known-good thumb
    set.push(`${m[1]}/image/cache/${m[2]}-800x800${m[4]}`);
  }
  // also handle plain image/catalog/foo-270x270.jpg
  const m2 = u.match(/^(https?:\/\/.+?)(-\d+x\d+)(\.\w+)$/i);
  if (m2) set.push(`${m2[1]}${m2[3]}`);
  return [...new Set(set)];
}

async function fetchImage(u) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(u, { headers: IMG_HEADERS });
      const ct = res.headers.get("content-type") || "";
      if (res.ok && ct.startsWith("image/")) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 100) return buf;
      }
      return null;
    } catch {
      await sleep(600 * (i + 1));
    }
  }
  return null;
}

const products = load("products.json");
const home = load("home.json");
const blog = load("blog.json");

const urls = new Set();
products.forEach((p) => (p.images || []).forEach((u) => u && urls.add(u)));
(home.slides || []).forEach((s) => s.src && urls.add(s.src));
(home.why_choose_us || []).forEach((s) => s.icon && urls.add(s.icon));
(home.fabric_brands || []).forEach((u) => u && urls.add(u));
(home.promo_banners || []).forEach((b) => b.src && urls.add(b.src));
blog.forEach((b) => b.image && urls.add(b.image));

const list = [...urls].filter((u) => u && u.startsWith("http") && !u.startsWith("data:"));
console.log("images to fetch:", list.length);

const localMap = {};
let done = 0,
  failed = 0,
  fixed = 0;

for (const u of list) {
  const ext = ((path.extname(new URL(u).pathname) || ".jpg").split("?")[0] || ".jpg").toLowerCase();
  const name = crypto.createHash("md5").update(u).digest("hex").slice(0, 16) + ext;
  const dest = path.join(OUT, name);

  let ok = fs.existsSync(dest) && fs.statSync(dest).size > 100;
  if (!ok) {
    for (const cand of candidates(u)) {
      const buf = await fetchImage(cand);
      if (buf) {
        fs.writeFileSync(dest, buf);
        ok = true;
        fixed++;
        break;
      }
    }
    await sleep(250);
  }
  if (ok) localMap[u] = "/img/" + name;
  else failed++;

  if (++done % 50 === 0) console.log(`  ${done}/${list.length}  (fixed ${fixed}, failed ${failed})`);
}

fs.writeFileSync(path.join(process.cwd(), "data", "image-map.json"), JSON.stringify(localMap, null, 2));
console.log(`done. mapped ${Object.keys(localMap).length}, downloaded ${fixed}, failed ${failed}`);

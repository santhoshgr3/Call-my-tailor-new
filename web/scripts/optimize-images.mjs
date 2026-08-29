import { readdir, stat, readFile, writeFile, rename } from "node:fs/promises";
import { join, extname } from "node:path";
import sharp from "sharp";

const DIR = join(process.cwd(), "public", "img");
const MAX_W = 1400;
const JPEG_Q = 80;
const SIZE_TRIGGER = 300 * 1024; // only touch files bigger than this

const files = (await readdir(DIR, { withFileTypes: true }))
  .filter((d) => d.isFile() && /\.(jpe?g|png)$/i.test(d.name))
  .map((d) => d.name);

let processed = 0;
let savedBytes = 0;
let skipped = 0;

for (const name of files) {
  const path = join(DIR, name);
  const before = (await stat(path)).size;
  if (before < SIZE_TRIGGER) {
    skipped++;
    continue;
  }
  try {
    const buf = await readFile(path);
    const img = sharp(buf, { failOn: "none" });
    const meta = await img.metadata();
    let pipeline = img;
    if ((meta.width || 0) > MAX_W) {
      pipeline = pipeline.resize({ width: MAX_W, withoutEnlargement: true });
    }
    const isPng = extname(name).toLowerCase() === ".png";
    // Re-encode PNGs (often huge photos wrongly saved as PNG) to JPEG,
    // keeping the .png filename so DB/image-map references still resolve.
    const out = isPng
      ? await pipeline.jpeg({ quality: JPEG_Q, mozjpeg: true }).toBuffer()
      : await pipeline.jpeg({ quality: JPEG_Q, mozjpeg: true }).toBuffer();

    if (out.length < before) {
      await writeFile(path, out);
      savedBytes += before - out.length;
      processed++;
    } else {
      skipped++;
    }
  } catch (e) {
    console.warn("skip", name, e.message);
    skipped++;
  }
  if ((processed + skipped) % 100 === 0) {
    console.log(`  ${processed + skipped}/${files.length}`);
  }
}

console.log(
  `Done. Re-encoded ${processed}, skipped ${skipped}. Saved ${(savedBytes / 1024 / 1024).toFixed(1)} MB.`,
);
void rename;

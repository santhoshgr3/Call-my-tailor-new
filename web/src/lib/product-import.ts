import "server-only";
import { serializeTags } from "@/lib/product-extras";
import ExcelJS from "exceljs";
import { Readable } from "node:stream";
import { db } from "./db";
import { EMPTY_PRODUCT } from "./admin-helpers";

/* ------------------------------------------------------------------ */
/* Columns                                                              */
/* ------------------------------------------------------------------ */

export const MAX_OPTIONS = 5;
export const MAX_ROWS = 5000;

type ColDef = { key: string; header: string; width: number; note: string };

const BASE_COLUMNS: ColDef[] = [
  { key: "name", header: "Name*", width: 34, note: "Product name (required for new products)." },
  { key: "slug", header: "Slug", width: 26, note: "URL part. Leave blank to build it from the name." },
  { key: "sku", header: "SKU", width: 14, note: "Product code. Used (with the slug) to find existing products when updating." },
  { key: "price", header: "Price*", width: 10, note: "Selling price in rupees, e.g. 12500. Required for new products." },
  { key: "old_price", header: "Old Price", width: 10, note: "Struck-through price. Leave blank for none." },
  { key: "stock_status", header: "Stock Status", width: 14, note: "In Stock, Out Of Stock, 2-3 Days or Pre-Order." },
  { key: "quantity", header: "Quantity", width: 10, note: "Units in stock." },
  { key: "short_description", header: "Short Description", width: 34, note: "One or two lines shown under the title." },
  { key: "description", header: "Description", width: 50, note: "Full description. Plain text or HTML (<p>, <ul>, <b> …)." },
  { key: "categories", header: "Categories", width: 28, note: "Category slugs or names separated by ; or | — e.g. formal-suit; casual-suit." },
  { key: "images", header: "Images", width: 50, note: "Image URLs separated by | or ; (the first is the main image). Use /media/… links for uploaded images." },
  { key: "is_active", header: "Active", width: 9, note: "Yes / No. Inactive products are hidden from the shop." },
  { key: "is_featured", header: "Featured", width: 9, note: "Yes / No." },
  { key: "is_best_seller", header: "Best Seller", width: 11, note: "Yes / No — feeds the Best Sellers rail." },
  { key: "is_new_arrival", header: "New Arrival", width: 11, note: "Yes / No — feeds the New Arrivals rail." },
  { key: "is_trending", header: "Trending", width: 9, note: "Yes / No." },
  { key: "tags", header: "Tags", width: 30, note: "Comma-separated tags shown under the product, e.g. cream trousers, casual pants fabric." },
  { key: "meta_title", header: "Meta Title", width: 30, note: "SEO title (optional)." },
  { key: "meta_description", header: "Meta Description", width: 36, note: "SEO description (optional)." },
  { key: "specs", header: "Specs", width: 40, note: "Item specifics as  Key: Value | Key: Value  (you can also use the “Spec: …” columns)." },
];

function optionCols(): ColDef[] {
  const out: ColDef[] = [];
  for (let i = 1; i <= MAX_OPTIONS; i++) {
    out.push({
      key: `option${i}_name`,
      header: `Option ${i} Name`,
      width: 20,
      note: i === 1 ? "Choice the customer makes, e.g. Size or Customization Method." : "",
    });
    out.push({
      key: `option${i}_values`,
      header: `Option ${i} Values`,
      width: 36,
      note:
        i === 1
          ? "Choices separated by commas, with an optional extra price:  S, M, L (+200), XL (+400)."
          : "",
    });
  }
  return out;
}

const COLUMNS: ColDef[] = [...BASE_COLUMNS, ...optionCols()];

const ALIASES: Record<string, string> = {
  product_name: "name",
  title: "name",
  product: "name",
  product_code: "sku",
  code: "sku",
  selling_price: "price",
  sale_price: "price",
  regular_price: "old_price",
  mrp: "old_price",
  compare_at_price: "old_price",
  stock: "quantity",
  qty: "quantity",
  stock_qty: "quantity",
  availability: "stock_status",
  short_desc: "short_description",
  summary: "short_description",
  long_description: "description",
  details: "description",
  category: "categories",
  image: "images",
  image_urls: "images",
  image_url: "images",
  photos: "images",
  active: "is_active",
  enabled: "is_active",
  published: "is_active",
  featured: "is_featured",
  best_seller: "is_best_seller",
  bestseller: "is_best_seller",
  new_arrival: "is_new_arrival",
  new: "is_new_arrival",
  trending: "is_trending",
  seo_title: "meta_title",
  seo_description: "meta_description",
  item_specifics: "specs",
  specifications: "specs",
};

function normHeader(h: string): string {
  return h
    .replace(/\*/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Map a raw header cell to either a canonical key or a dynamic spec column. */
function classifyHeader(raw: string): { key?: string; spec?: string } {
  const spec = raw.match(/^\s*spec(?:ification)?\s*[:\-]\s*(.+)$/i);
  if (spec) return { spec: spec[1].trim() };
  let k = normHeader(raw);
  k = ALIASES[k] ?? k;
  // "option_1_name" / "option1name" style
  const m = k.match(/^option_?(\d)_?(name|values?)$/);
  if (m) k = `option${m[1]}_${m[2] === "name" ? "name" : "values"}`;
  return COLUMNS.some((c) => c.key === k) ? { key: k } : {};
}

/* ------------------------------------------------------------------ */
/* Reading a workbook                                                   */
/* ------------------------------------------------------------------ */

export type RawRecord = {
  row: number;
  cells: Record<string, string>;
  specs: Record<string, string>;
};

function cellText(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const o = v as unknown as Record<string, unknown>;
  if (Array.isArray(o.richText)) {
    return (o.richText as { text: string }[]).map((t) => t.text).join("").trim();
  }
  if ("result" in o && o.result != null) return cellText(o.result as ExcelJS.CellValue);
  if ("text" in o && o.text != null) return cellText(o.text as ExcelJS.CellValue);
  if ("hyperlink" in o && typeof o.hyperlink === "string") return o.hyperlink;
  return "";
}

export async function readRecords(
  buf: Buffer,
  filename: string,
): Promise<{ records: RawRecord[]; unknownHeaders: string[]; fatal?: string }> {
  const wb = new ExcelJS.Workbook();
  try {
    if (/\.csv$/i.test(filename)) {
      await wb.csv.read(Readable.from(buf));
    } else {
      await wb.xlsx.load(buf as unknown as ExcelJS.Buffer);
    }
  } catch {
    return { records: [], unknownHeaders: [], fatal: "That file could not be read. Upload the .xlsx template or a .csv file." };
  }

  const ws = wb.getWorksheet("Products") ?? wb.worksheets[0];
  if (!ws) return { records: [], unknownHeaders: [], fatal: "The file has no sheets." };

  const headerRow = ws.getRow(1);
  const cols: { idx: number; key?: string; spec?: string }[] = [];
  const unknown: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell, idx) => {
    const raw = cellText(cell.value);
    if (!raw) return;
    const c = classifyHeader(raw);
    if (c.key || c.spec) cols.push({ idx, ...c });
    else unknown.push(raw);
  });
  if (!cols.some((c) => c.key === "name" || c.key === "sku" || c.key === "slug")) {
    return {
      records: [],
      unknownHeaders: unknown,
      fatal: "The first row must contain column headings such as Name, Price and SKU. Download the template to see the layout.",
    };
  }

  const records: RawRecord[] = [];
  const last = ws.rowCount;
  if (last - 1 > MAX_ROWS) {
    return { records: [], unknownHeaders: unknown, fatal: `Too many rows (${last - 1}). The limit is ${MAX_ROWS} per file — split the file.` };
  }
  for (let r = 2; r <= last; r++) {
    const row = ws.getRow(r);
    const cells: Record<string, string> = {};
    const specs: Record<string, string> = {};
    let any = false;
    for (const c of cols) {
      const t = cellText(row.getCell(c.idx).value);
      if (!t) continue;
      any = true;
      if (c.key) cells[c.key] = t;
      else if (c.spec) specs[c.spec] = t;
    }
    if (!any) continue;
    if ((cells.name ?? "").toLowerCase().startsWith("(example)")) continue;
    records.push({ row: r, cells, specs });
  }
  return { records, unknownHeaders: unknown };
}

/* ------------------------------------------------------------------ */
/* Normalising one row                                                  */
/* ------------------------------------------------------------------ */

export type ImportMode = "create" | "update" | "upsert";
export type ImportOptions = {
  mode: ImportMode;
  createCategories: boolean;
  defaultOptions: boolean;
};

type OptionData = { label: string; values: { label: string; priceDelta: number }[] };

export type Norm = {
  name?: string;
  slug?: string;
  sku?: string;
  price?: number;
  oldPrice?: number | null;
  stockStatus?: string;
  quantity?: number;
  shortDescription?: string;
  description?: string;
  descriptionHtml?: string;
  categoryTokens?: string[];
  images?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isTrending?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  tags?: string | null;
  specs?: { key: string; value: string }[];
  options?: OptionData[];
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function toNumber(v: string): number | null {
  const cleaned = v.replace(/[₹,\s]|rs\.?/gi, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function toBool(v: string | undefined): boolean | undefined | "bad" {
  if (v == null || v === "") return undefined;
  const s = v.trim().toLowerCase();
  if (["yes", "y", "true", "1", "on", "active"].includes(s)) return true;
  if (["no", "n", "false", "0", "off", "inactive"].includes(s)) return false;
  return "bad";
}

/** Split on separators that are not inside parentheses. */
function splitTop(s: string, seps: RegExp): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth = Math.max(0, depth - 1);
    if (depth === 0 && seps.test(ch)) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function toHtml(text: string) {
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  return "<p>" + text.replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br/>") + "</p>";
}

export function normalizeRecord(rec: RawRecord): { data: Norm; errors: string[]; warnings: string[] } {
  const c = rec.cells;
  const errors: string[] = [];
  const warnings: string[] = [];
  const data: Norm = {};

  if (c.name) data.name = c.name.slice(0, 200);
  if (c.slug) data.slug = slugify(c.slug);
  if (c.sku) data.sku = c.sku.slice(0, 60);

  if (c.price != null) {
    const n = toNumber(c.price);
    if (n == null || n < 0) errors.push(`Price “${c.price}” is not a number.`);
    else data.price = Math.round(n);
  }
  if (c.old_price != null) {
    const n = toNumber(c.old_price);
    if (n == null || n < 0) errors.push(`Old price “${c.old_price}” is not a number.`);
    else data.oldPrice = n > 0 ? Math.round(n) : null;
  }
  if (c.quantity != null) {
    const n = toNumber(c.quantity);
    if (n == null || n < 0) errors.push(`Quantity “${c.quantity}” is not a number.`);
    else data.quantity = Math.round(n);
  }
  if (c.stock_status) data.stockStatus = c.stock_status.slice(0, 40);
  if (c.short_description) data.shortDescription = c.short_description.slice(0, 500);
  if (c.description) {
    data.descriptionHtml = toHtml(c.description);
    data.description = stripHtml(c.description);
  }
  if (c.tags) data.tags = serializeTags(c.tags);
  if (c.meta_title) data.metaTitle = c.meta_title.slice(0, 200);
  if (c.meta_description) data.metaDescription = c.meta_description.slice(0, 400);

  const flags: [string, keyof Norm][] = [
    ["is_active", "isActive"],
    ["is_featured", "isFeatured"],
    ["is_best_seller", "isBestSeller"],
    ["is_new_arrival", "isNewArrival"],
    ["is_trending", "isTrending"],
  ];
  for (const [col, field] of flags) {
    const b = toBool(c[col]);
    if (b === "bad") warnings.push(`“${c[col]}” is not Yes/No — ignored for ${col.replace("is_", "").replace("_", " ")}.`);
    else if (b !== undefined) (data as Record<string, unknown>)[field] = b;
  }

  if (c.categories) data.categoryTokens = splitTop(c.categories, /[|;,\n]/);

  if (c.images) {
    const urls = splitTop(c.images, /[|;\n]/);
    const good: string[] = [];
    for (const u of urls) {
      if (/^https?:\/\//i.test(u) || u.startsWith("/")) good.push(u);
      else warnings.push(`Image “${u.slice(0, 40)}” is not a link — skipped.`);
    }
    if (good.length) data.images = good;
  }

  const specs: { key: string; value: string }[] = [];
  if (c.specs) {
    for (const part of splitTop(c.specs, /[|;\n]/)) {
      const i = part.indexOf(":");
      if (i > 0 && part.slice(i + 1).trim()) {
        specs.push({ key: part.slice(0, i).trim(), value: part.slice(i + 1).trim() });
      } else warnings.push(`Spec “${part.slice(0, 30)}” should look like  Key: Value.`);
    }
  }
  for (const [k, v] of Object.entries(rec.specs)) specs.push({ key: k, value: v });
  if (specs.length) data.specs = specs;

  const options: OptionData[] = [];
  for (let i = 1; i <= MAX_OPTIONS; i++) {
    const label = c[`option${i}_name`];
    const raw = c[`option${i}_values`];
    if (!label && !raw) continue;
    if (!label || !raw) {
      warnings.push(`Option ${i} needs both a name and values — skipped.`);
      continue;
    }
    const values = splitTop(raw, /[,|;\n]/).map((v) => {
      const m = v.match(/^(.*?)\s*\(\s*([+-]?)\s*(?:₹|rs\.?)?\s*([\d,.]+)\s*\)\s*$/i);
      if (m) {
        const amount = Math.round(Number(m[3].replace(/,/g, "")) || 0);
        return { label: m[1].trim(), priceDelta: m[2] === "-" ? -amount : amount };
      }
      return { label: v, priceDelta: 0 };
    });
    options.push({ label: label.replace(/\*/g, "").trim(), values: values.filter((v) => v.label) });
  }
  if (options.length) data.options = options;

  return { data, errors, warnings };
}

/* ------------------------------------------------------------------ */
/* Matching & applying                                                  */
/* ------------------------------------------------------------------ */

type CatRow = { id: string; slug: string; name: string };
type ExistingRow = { id: string; slug: string; sku: string | null; name: string };

export type Ctx = {
  categories: CatRow[];
  bySku: Map<string, ExistingRow[]>;
  bySlug: Map<string, ExistingRow>;
};

export async function buildCtx(records: RawRecord[]): Promise<Ctx> {
  const categories = await db.category.findMany({ select: { id: true, slug: true, name: true } });
  const skus = new Set<string>();
  const slugs = new Set<string>();
  for (const r of records) {
    if (r.cells.sku) skus.add(r.cells.sku);
    if (r.cells.slug) slugs.add(slugify(r.cells.slug));
    else if (r.cells.name) slugs.add(slugify(r.cells.name));
  }
  const existing: ExistingRow[] = [];
  const skuList = [...skus];
  const slugList = [...slugs];
  for (let i = 0; i < Math.max(skuList.length, slugList.length, 1); i += 400) {
    const rows = await db.product.findMany({
      where: {
        OR: [
          { sku: { in: skuList.slice(i, i + 400) } },
          { slug: { in: slugList.slice(i, i + 400) } },
        ],
      },
      select: { id: true, slug: true, sku: true, name: true },
    });
    existing.push(...rows);
  }
  const bySku = new Map<string, ExistingRow[]>();
  const bySlug = new Map<string, ExistingRow>();
  for (const e of existing) {
    bySlug.set(e.slug, e);
    if (e.sku) bySku.set(e.sku, [...(bySku.get(e.sku) ?? []), e]);
  }
  return { categories, bySku, bySlug };
}

function findExisting(data: Norm, ctx: Ctx): { row?: ExistingRow; error?: string } {
  if (data.sku) {
    const hits = ctx.bySku.get(data.sku) ?? [];
    if (hits.length === 1) return { row: hits[0] };
    if (hits.length > 1) {
      const slug = data.slug ?? (data.name ? slugify(data.name) : "");
      const pick = hits.find((h) => h.slug === slug);
      if (pick) return { row: pick };
      return { error: `SKU ${data.sku} matches ${hits.length} products — add the Slug to pick one.` };
    }
  }
  const slug = data.slug ?? (data.name ? slugify(data.name) : "");
  if (slug && ctx.bySlug.has(slug)) return { row: ctx.bySlug.get(slug) };
  return {};
}

function resolveCategories(
  tokens: string[],
  ctx: Ctx,
  create: boolean,
): { ids: string[]; toCreate: string[]; unknown: string[] } {
  const ids: string[] = [];
  const toCreate: string[] = [];
  const unknown: string[] = [];
  for (const raw of tokens) {
    const t = raw.split(/[/>]/).pop()!.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    const hit =
      ctx.categories.find((c) => c.slug === key || c.slug === slugify(t)) ??
      ctx.categories.find((c) => c.name.toLowerCase() === key);
    if (hit) {
      if (!ids.includes(hit.id)) ids.push(hit.id);
    } else if (create) toCreate.push(t);
    else unknown.push(t);
  }
  return { ids, toCreate, unknown };
}

export type RowResult = {
  row: number;
  action: "create" | "update" | "skip" | "error";
  name: string;
  slug: string;
  sku: string;
  price: number | null;
  fields: string[];
  errors: string[];
  warnings: string[];
};

/** Validate one record and decide what would happen — no writes. */
export function planRecord(rec: RawRecord, ctx: Ctx, opts: ImportOptions) {
  const { data, errors, warnings } = normalizeRecord(rec);
  const found = findExisting(data, ctx);
  if (found.error) errors.push(found.error);

  let action: RowResult["action"] = "error";
  if (!errors.length) {
    if (found.row) {
      if (opts.mode === "create") {
        action = "skip";
        warnings.push("Already exists — skipped (mode: create only).");
      } else action = "update";
    } else if (opts.mode === "update") {
      action = "skip";
      warnings.push("No matching product — skipped (mode: update only).");
    } else {
      if (!data.name) errors.push("Name is required for a new product.");
      if (data.price == null) errors.push("Price is required for a new product.");
      action = errors.length ? "error" : "create";
    }
  }

  if (data.categoryTokens) {
    const r = resolveCategories(data.categoryTokens, ctx, opts.createCategories);
    for (const u of r.unknown) warnings.push(`Category “${u}” not found — skipped.`);
    for (const c of r.toCreate) warnings.push(`Category “${c}” will be created.`);
  }

  const fields = Object.keys(data).filter((k) => (data as Record<string, unknown>)[k] !== undefined);
  const result: RowResult = {
    row: rec.row,
    action: errors.length ? "error" : action,
    name: data.name ?? found.row?.name ?? "",
    slug: data.slug ?? found.row?.slug ?? (data.name ? slugify(data.name) : ""),
    sku: data.sku ?? found.row?.sku ?? "",
    price: data.price ?? null,
    fields,
    errors,
    warnings,
  };
  return { result, data, existing: found.row };
}

async function uniqueSlug(base: string, ignoreId?: string) {
  const root = base || "product";
  let slug = root;
  let i = 2;
  while (true) {
    const e = await db.product.findUnique({ where: { slug }, select: { id: true } });
    if (!e || e.id === ignoreId) return slug;
    slug = `${root}-${i++}`;
  }
}

async function ensureCategories(
  tokens: string[],
  ctx: Ctx,
  create: boolean,
): Promise<string[]> {
  const r = resolveCategories(tokens, ctx, create);
  const ids = [...r.ids];
  for (const name of r.toCreate) {
    const slug = await (async () => {
      let s = slugify(name) || "category";
      let i = 2;
      while (await db.category.findUnique({ where: { slug: s }, select: { id: true } })) s = `${slugify(name)}-${i++}`;
      return s;
    })();
    const made = await db.category.create({ data: { name, slug, isActive: true, showInMenu: true } });
    ctx.categories.push({ id: made.id, slug: made.slug, name: made.name });
    ids.push(made.id);
  }
  return ids;
}

/** Validate and write one record. */
export async function applyRecord(rec: RawRecord, ctx: Ctx, opts: ImportOptions): Promise<RowResult> {
  const { result, data, existing } = planRecord(rec, ctx, opts);
  if (result.action === "error" || result.action === "skip") return result;

  try {
    const categoryIds = data.categoryTokens
      ? await ensureCategories(data.categoryTokens, ctx, opts.createCategories)
      : undefined;

    if (result.action === "create") {
      const slug = await uniqueSlug(data.slug ?? slugify(data.name!));
      const options =
        data.options ??
        (opts.defaultOptions
          ? EMPTY_PRODUCT.options.map((o) => ({
              label: o.label,
              values: o.values.map((v) => ({ label: v.label, priceDelta: v.priceDelta })),
            }))
          : []);
      const images = data.images ?? [];
      const created = await db.product.create({
        data: {
          name: data.name!,
          slug,
          sku: data.sku ?? null,
          price: data.price!,
          oldPrice: data.oldPrice ?? null,
          stockStatus: data.stockStatus ?? "In Stock",
          quantity: data.quantity ?? 100,
          shortDescription: data.shortDescription ?? null,
          description: data.description ?? null,
          descriptionHtml: data.descriptionHtml ?? null,
          tags: data.tags ?? null,
          metaTitle: data.metaTitle ?? null,
          metaDescription: data.metaDescription ?? null,
          isActive: data.isActive ?? true,
          isFeatured: data.isFeatured ?? false,
          isBestSeller: data.isBestSeller ?? false,
          isNewArrival: data.isNewArrival ?? false,
          isTrending: data.isTrending ?? false,
          hasImage: images.length > 0,
          categories: { create: (categoryIds ?? []).map((categoryId) => ({ categoryId })) },
          images: { create: images.map((url, i) => ({ url, alt: data.name!, sortOrder: i })) },
          specs: { create: (data.specs ?? []).map((s, i) => ({ key: s.key, value: s.value, sortOrder: i })) },
          options: {
            create: options.map((o, i) => ({
              label: o.label,
              type: "select",
              required: true,
              sortOrder: i,
              values: {
                create: o.values.map((v, j) => ({ label: v.label, priceDelta: v.priceDelta, sortOrder: j })),
              },
            })),
          },
        },
        select: { id: true, slug: true, sku: true, name: true },
      });
      ctx.bySlug.set(created.slug, created);
      if (created.sku) ctx.bySku.set(created.sku, [...(ctx.bySku.get(created.sku) ?? []), created]);
      result.slug = created.slug;
      return result;
    }

    // update
    const id = existing!.id;
    const ops = [];
    const scalar: Record<string, unknown> = {};
    if (data.name !== undefined) scalar.name = data.name;
    if (data.sku !== undefined) scalar.sku = data.sku;
    if (data.price !== undefined) scalar.price = data.price;
    if (data.oldPrice !== undefined) scalar.oldPrice = data.oldPrice;
    if (data.stockStatus !== undefined) scalar.stockStatus = data.stockStatus;
    if (data.quantity !== undefined) scalar.quantity = data.quantity;
    if (data.shortDescription !== undefined) scalar.shortDescription = data.shortDescription;
    if (data.description !== undefined) {
      scalar.description = data.description;
      scalar.descriptionHtml = data.descriptionHtml;
    }
    if (data.tags !== undefined) scalar.tags = data.tags;
    if (data.metaTitle !== undefined) scalar.metaTitle = data.metaTitle;
    if (data.metaDescription !== undefined) scalar.metaDescription = data.metaDescription;
    for (const f of ["isActive", "isFeatured", "isBestSeller", "isNewArrival", "isTrending"] as const) {
      if (data[f] !== undefined) scalar[f] = data[f];
    }
    if (data.slug && data.slug !== existing!.slug) scalar.slug = await uniqueSlug(data.slug, id);

    if (data.images) {
      ops.push(db.productImage.deleteMany({ where: { productId: id } }));
      scalar.hasImage = data.images.length > 0;
      scalar.images = {
        create: data.images.map((url, i) => ({ url, alt: data.name ?? existing!.name, sortOrder: i })),
      };
    }
    if (categoryIds) {
      ops.push(db.productCategory.deleteMany({ where: { productId: id } }));
      scalar.categories = { create: categoryIds.map((categoryId) => ({ categoryId })) };
    }
    if (data.options) {
      ops.push(db.productOptionValue.deleteMany({ where: { option: { productId: id } } }));
      ops.push(db.productOption.deleteMany({ where: { productId: id } }));
      scalar.options = {
        create: data.options.map((o, i) => ({
          label: o.label,
          type: "select",
          required: true,
          sortOrder: i,
          values: {
            create: o.values.map((v, j) => ({ label: v.label, priceDelta: v.priceDelta, sortOrder: j })),
          },
        })),
      };
    }
    if (data.specs) {
      const current = await db.productSpec.findMany({ where: { productId: id }, orderBy: { sortOrder: "asc" } });
      let next = current.reduce((m, s) => Math.max(m, s.sortOrder), -1) + 1;
      const toCreate: { key: string; value: string; sortOrder: number }[] = [];
      for (const s of data.specs) {
        const hit = current.find((c) => c.key.toLowerCase() === s.key.toLowerCase());
        if (hit) ops.push(db.productSpec.update({ where: { id: hit.id }, data: { value: s.value } }));
        else toCreate.push({ key: s.key, value: s.value, sortOrder: next++ });
      }
      if (toCreate.length) scalar.specs = { create: toCreate };
    }

    if (Object.keys(scalar).length || ops.length) {
      await db.$transaction([...ops, db.product.update({ where: { id }, data: scalar })]);
    }
    return result;
  } catch (e) {
    result.action = "error";
    result.errors.push(e instanceof Error ? e.message.split("\n").pop()!.slice(0, 160) : "Could not save this row.");
    return result;
  }
}

/* ------------------------------------------------------------------ */
/* Writing a workbook (template or export)                              */
/* ------------------------------------------------------------------ */

type ExportProduct = {
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  oldPrice: number | null;
  stockStatus: string;
  quantity: number;
  shortDescription: string | null;
  description: string | null;
  descriptionHtml: string | null;
  isActive: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isTrending: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  tags: string | null;
  categories: { category: { slug: string } }[];
  images: { url: string }[];
  specs: { key: string; value: string }[];
  options: { label: string; values: { label: string; priceDelta: number }[] }[];
};

const yn = (b: boolean) => (b ? "Yes" : "No");

export async function buildWorkbook(products: ExportProduct[], template: boolean, format: "xlsx" | "csv") {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Call My Tailor admin";

  // spec columns: every key used by at least one product (capped)
  const specKeys: string[] = [];
  if (!template) {
    const counts = new Map<string, number>();
    for (const p of products) for (const s of p.specs) counts.set(s.key, (counts.get(s.key) ?? 0) + 1);
    specKeys.push(...[...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([k]) => k));
  } else {
    specKeys.push("Color", "Fabric Brand", "Material Quality");
  }

  const ws = wb.addWorksheet("Products", { views: [{ state: "frozen", ySplit: 1, xSplit: 1 }] });
  const cols = [
    ...BASE_COLUMNS.filter((c) => c.key !== "specs"),
    ...specKeys.map((k) => ({ key: `spec:${k}`, header: `Spec: ${k}`, width: 18, note: "" })),
    ...optionCols(),
  ];
  ws.columns = cols.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEB3740" } };
  head.alignment = { vertical: "middle" };
  head.height = 22;

  if (template) {
    ws.addRow({
      name: "(example) Navy Blue Three Piece Suit",
      slug: "",
      sku: "MPS900",
      price: 12500,
      old_price: 14500,
      stock_status: "In Stock",
      quantity: 100,
      short_description: "Tailored 3-piece suit in premium fabric.",
      description: "<p>Premium navy suit stitched to your measurements.</p>",
      categories: "formal-suit; party-suits",
      images: "https://example.com/suit-front.jpg | https://example.com/suit-back.jpg",
      is_active: "Yes",
      is_featured: "No",
      is_best_seller: "Yes",
      is_new_arrival: "Yes",
      is_trending: "No",
      tags: "navy suit, wedding suit, wool blend",
      meta_title: "",
      meta_description: "",
      "spec:Color": "Navy Blue",
      "spec:Fabric Brand": "Raymond",
      "spec:Material Quality": "Wool blend",
      option1_name: "Customization Method",
      option1_values: "Tailor Home Visit, Customization on Call, Ready to Ship (Standard Size)",
      option2_name: "Size",
      option2_values: "36, 38, 40, 42, 44 (+300), 46 (+300)",
    });
    ws.getRow(2).font = { italic: true, color: { argb: "FF888888" } };
  } else {
    for (const p of products) {
      const row: Record<string, string | number> = {
        name: p.name,
        slug: p.slug,
        sku: p.sku ?? "",
        price: p.price,
        old_price: p.oldPrice ?? "",
        stock_status: p.stockStatus,
        quantity: p.quantity,
        short_description: p.shortDescription ?? "",
        description: p.descriptionHtml || p.description || "",
        categories: p.categories.map((c) => c.category.slug).join("; "),
        images: p.images.map((i) => i.url).join(" | "),
        is_active: yn(p.isActive),
        is_featured: yn(p.isFeatured),
        is_best_seller: yn(p.isBestSeller),
        is_new_arrival: yn(p.isNewArrival),
        is_trending: yn(p.isTrending),
        tags: p.tags ?? "",
        meta_title: p.metaTitle ?? "",
        meta_description: p.metaDescription ?? "",
      };
      for (const k of specKeys) {
        const s = p.specs.find((x) => x.key === k);
        if (s) row[`spec:${k}`] = s.value;
      }
      // Products with more options than the sheet holds are left blank so an update never drops them.
      if (p.options.length <= MAX_OPTIONS) {
        p.options.forEach((o, i) => {
          row[`option${i + 1}_name`] = o.label;
          row[`option${i + 1}_values`] = o.values
            .map((v) => (v.priceDelta ? `${v.label} (${v.priceDelta > 0 ? "+" : "-"}${Math.abs(v.priceDelta)})` : v.label))
            .join(", ");
        });
      }
      ws.addRow(row);
    }
  }

  // dropdowns for Yes/No and stock status
  const colIndex = (key: string) => cols.findIndex((c) => c.key === key) + 1;
  const dataRows = Math.max(products.length + 1, 200);
  for (const key of ["is_active", "is_featured", "is_best_seller", "is_new_arrival", "is_trending"]) {
    const idx = colIndex(key);
    for (let r = 2; r <= dataRows; r++) {
      ws.getCell(r, idx).dataValidation = { type: "list", allowBlank: true, formulae: ['"Yes,No"'] };
    }
  }
  const si = colIndex("stock_status");
  for (let r = 2; r <= dataRows; r++) {
    ws.getCell(r, si).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"In Stock,Out Of Stock,2-3 Days,Pre-Order"'],
    };
  }

  if (format === "xlsx") {
    const help = wb.addWorksheet("Instructions");
    help.columns = [
      { header: "Column", key: "c", width: 26 },
      { header: "What to enter", key: "n", width: 110 },
    ];
    help.getRow(1).font = { bold: true };
    help.addRow({ c: "HOW IT WORKS", n: "One row per product. Fill in the Products sheet, save, then upload it in Admin → Products → Import / Export. You will see a preview before anything is saved." });
    help.addRow({ c: "UPDATING", n: "To change existing products, export them first, edit the sheet and upload it again. Products are matched by SKU, then by slug (or the name if no slug). Blank cells are left unchanged." });
    help.addRow({ c: "EXAMPLE ROWS", n: "Rows whose name starts with “(example)” are ignored." });
    help.addRow({});
    for (const c of BASE_COLUMNS) help.addRow({ c: c.header, n: c.note });
    help.addRow({ c: "Spec: <name>", n: "Any column headed “Spec: Color”, “Spec: Fabric Brand” … becomes an item specific. Add as many as you like." });
    help.addRow({ c: "Option N Name / Values", n: `Up to ${MAX_OPTIONS} choices the customer picks, e.g. Size = 36, 38, 40 (+200). The text after + is the extra price.` });
    help.eachRow((r, n) => {
      if (n > 1) r.alignment = { wrapText: true, vertical: "top" };
    });
  }

  if (format === "csv") {
    return Buffer.from(await wb.csv.writeBuffer());
  }
  return Buffer.from(await wb.xlsx.writeBuffer());
}

"use server";

import { revalidatePath } from "next/cache";
import { bustStorefrontCache } from "@/lib/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { serializeTags, serializeCustomTabs } from "@/lib/product-extras";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

async function uniqueSlug(base: string, ignoreId?: string) {
  let slug = base || "product";
  let i = 2;
  while (true) {
    const existing = await db.product.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    slug = `${base}-${i++}`;
  }
}

type ParsedImage = { url: string; alt?: string };
type ParsedSpec = { key: string; value: string };
type ParsedOption = {
  label: string;
  type: string;
  required: boolean;
  values: { label: string; priceDelta: number }[];
};

function readJson<T>(fd: FormData, key: string, fallback: T): T {
  try {
    const raw = fd.get(key);
    if (!raw) return fallback;
    return JSON.parse(String(raw)) as T;
  } catch {
    return fallback;
  }
}

export type ProductFormState = { error?: string; ok?: boolean };

async function collect(fd: FormData) {
  const name = String(fd.get("name") || "").trim();
  if (!name) throw new Error("Product name is required");

  const price = Math.max(0, Math.round(Number(fd.get("price") || 0)));
  const oldPriceRaw = Number(fd.get("oldPrice") || 0);
  const images = readJson<ParsedImage[]>(fd, "images", []).filter((i) => i.url);
  const specs = readJson<ParsedSpec[]>(fd, "specs", []).filter((s) => s.key);
  const options = readJson<ParsedOption[]>(fd, "options", []).filter((o) => o.label);
  const categoryIds = readJson<string[]>(fd, "categoryIds", []);
  const htmlIn = String(fd.get("descriptionHtml") || "").trim();
  const description = htmlIn
    ? htmlIn.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/s+/g, " ").trim()
    : String(fd.get("description") || "").trim();

  return {
    name,
    slugInput: slugify(String(fd.get("slug") || "") || name),
    sku: String(fd.get("sku") || "").trim() || null,
    price,
    oldPrice: oldPriceRaw > 0 ? Math.round(oldPriceRaw) : null,
    stockStatus: String(fd.get("stockStatus") || "In Stock"),
    quantity: Math.max(0, Math.round(Number(fd.get("quantity") || 0))),
    shortDescription: String(fd.get("shortDescription") || "").trim() || null,
    description,
    descriptionHtml:
      htmlIn ||
      (description ? `<p>${description.replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br/>")}</p>` : ""),
    metaTitle: String(fd.get("metaTitle") || "").trim() || null,
    metaDescription: String(fd.get("metaDescription") || "").trim() || null,
    tags: serializeTags(String(fd.get("tags") || "")),
    customTabs: serializeCustomTabs(readJson<unknown>(fd, "customTabs", [])),
    isActive: fd.get("isActive") === "on",
    isFeatured: fd.get("isFeatured") === "on",
    isBestSeller: fd.get("isBestSeller") === "on",
    isNewArrival: fd.get("isNewArrival") === "on",
    isTrending: fd.get("isTrending") === "on",
    rating: Math.min(5, Math.max(0, Number(fd.get("rating") || 0))),
    ratingCount: Math.max(0, Math.round(Number(fd.get("ratingCount") || 0))),
    soldCount: Math.max(0, Math.round(Number(fd.get("soldCount") || 0))),
    images,
    specs,
    options,
    categoryIds,
  };
}

export async function createProduct(
  _prev: ProductFormState,
  fd: FormData,
): Promise<ProductFormState> {
  await requireAdmin();
  let newId: string;
  try {
    const d = await collect(fd);
    const slug = await uniqueSlug(d.slugInput);
    const created = await db.product.create({
      data: {
        name: d.name,
        slug,
        sku: d.sku,
        price: d.price,
        oldPrice: d.oldPrice,
        stockStatus: d.stockStatus,
        quantity: d.quantity,
        shortDescription: d.shortDescription,
        description: d.description,
        descriptionHtml: d.descriptionHtml,
        metaTitle: d.metaTitle,
        metaDescription: d.metaDescription,
        tags: d.tags,
        customTabs: d.customTabs,
        isActive: d.isActive,
        isFeatured: d.isFeatured,
        isBestSeller: d.isBestSeller,
        isNewArrival: d.isNewArrival,
        isTrending: d.isTrending,
        rating: d.rating,
        ratingCount: d.ratingCount,
        soldCount: d.soldCount,
        hasImage: d.images.length > 0,
        categories: { create: d.categoryIds.map((categoryId) => ({ categoryId })) },
        images: {
          create: d.images.map((im, i) => ({ url: im.url, alt: im.alt || d.name, sortOrder: i })),
        },
        specs: { create: d.specs.map((s, i) => ({ key: s.key, value: s.value, sortOrder: i })) },
        options: {
          create: d.options.map((o, i) => ({
            label: o.label,
            type: o.type || "select",
            required: o.required,
            sortOrder: i,
            values: {
              create: o.values.map((v, j) => ({
                label: v.label,
                priceDelta: Math.round(v.priceDelta || 0),
                sortOrder: j,
              })),
            },
          })),
        },
      },
    });
    newId = created.id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create product" };
  }
  bustStorefrontCache();
  revalidatePath("/admin/products");
  redirect(`/admin/products/${newId}?created=1`);
}

export async function updateProduct(
  _prev: ProductFormState,
  fd: FormData,
): Promise<ProductFormState> {
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (!id) return { error: "Missing product id" };
  try {
    const d = await collect(fd);
    const slug = await uniqueSlug(d.slugInput, id);
    await db.$transaction([
      db.productImage.deleteMany({ where: { productId: id } }),
      db.productSpec.deleteMany({ where: { productId: id } }),
      db.productOptionValue.deleteMany({ where: { option: { productId: id } } }),
      db.productOption.deleteMany({ where: { productId: id } }),
      db.productCategory.deleteMany({ where: { productId: id } }),
      db.product.update({
        where: { id },
        data: {
          name: d.name,
          slug,
          sku: d.sku,
          price: d.price,
          oldPrice: d.oldPrice,
          stockStatus: d.stockStatus,
          quantity: d.quantity,
          shortDescription: d.shortDescription,
          description: d.description,
          descriptionHtml: d.descriptionHtml,
          metaTitle: d.metaTitle,
          metaDescription: d.metaDescription,
        tags: d.tags,
        customTabs: d.customTabs,
          isActive: d.isActive,
          isFeatured: d.isFeatured,
          isBestSeller: d.isBestSeller,
          isNewArrival: d.isNewArrival,
          isTrending: d.isTrending,
          rating: d.rating,
          ratingCount: d.ratingCount,
          soldCount: d.soldCount,
          hasImage: d.images.length > 0,
          categories: { create: d.categoryIds.map((categoryId) => ({ categoryId })) },
          images: {
            create: d.images.map((im, i) => ({ url: im.url, alt: im.alt || d.name, sortOrder: i })),
          },
          specs: { create: d.specs.map((s, i) => ({ key: s.key, value: s.value, sortOrder: i })) },
          options: {
            create: d.options.map((o, i) => ({
              label: o.label,
              type: o.type || "select",
              required: o.required,
              sortOrder: i,
              values: {
                create: o.values.map((v, j) => ({
                  label: v.label,
                  priceDelta: Math.round(v.priceDelta || 0),
                  sortOrder: j,
                })),
              },
            })),
          },
        },
      }),
    ]);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not update product" };
  }
  bustStorefrontCache();
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  return { ok: true };
}

export async function deleteProduct(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (id) {
    await db.product.delete({ where: { id } });
  }
  bustStorefrontCache();
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function quickToggle(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") || "");
  const field = String(fd.get("field") || "");
  const allowed = ["isActive", "isFeatured", "isBestSeller", "isNewArrival", "isTrending"];
  if (!id || !allowed.includes(field)) return;
  const p = await db.product.findUnique({ where: { id } });
  if (!p) return;
  await db.product.update({
    where: { id },
    data: { [field]: !(p as unknown as Record<string, boolean>)[field] },
  });
  bustStorefrontCache();
  revalidatePath("/admin/products");
}

/** Apply one action to many selected products at once. */
export async function bulkProducts(fd: FormData) {
  await requireAdmin();
  const ids = fd.getAll("ids").map(String).filter(Boolean).slice(0, 500);
  const action = String(fd.get("bulk_action") || "");
  if (!ids.length || !action) return;
  const where = { id: { in: ids } };

  const flags: Record<string, [string, boolean]> = {
    activate: ["isActive", true],
    deactivate: ["isActive", false],
    feature_on: ["isFeatured", true],
    feature_off: ["isFeatured", false],
    best_on: ["isBestSeller", true],
    best_off: ["isBestSeller", false],
    new_on: ["isNewArrival", true],
    new_off: ["isNewArrival", false],
    trend_on: ["isTrending", true],
    trend_off: ["isTrending", false],
  };

  if (flags[action]) {
    const [field, value] = flags[action];
    await db.product.updateMany({ where, data: { [field]: value } });
  } else if (action === "delete") {
    await db.product.deleteMany({ where });
  } else if (action === "category_add" || action === "category_remove") {
    const slug = String(fd.get("category") || "");
    const cat = slug ? await db.category.findUnique({ where: { slug }, select: { id: true } }) : null;
    if (cat) {
      if (action === "category_add") {
        await db.productCategory.createMany({
          data: ids.map((productId) => ({ productId, categoryId: cat.id })),
          skipDuplicates: true,
        });
      } else {
        await db.productCategory.deleteMany({ where: { categoryId: cat.id, productId: { in: ids } } });
      }
    }
  } else if (action === "price_pct" || action === "price_add") {
    const amount = Number(fd.get("amount"));
    if (Number.isFinite(amount) && amount !== 0) {
      const rows = await db.product.findMany({ where, select: { id: true, price: true } });
      await db.$transaction(
        rows.map((r) =>
          db.product.update({
            where: { id: r.id },
            data: {
              price: Math.max(
                0,
                Math.round(action === "price_pct" ? r.price * (1 + amount / 100) : r.price + amount),
              ),
            },
          }),
        ),
      );
    }
  }

  bustStorefrontCache();
  revalidatePath("/admin/products");
}

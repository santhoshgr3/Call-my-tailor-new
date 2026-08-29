import { db } from "./db";
import type { Prisma } from "@prisma/client";

export const PRODUCT_CARD_SELECT = {
  id: true,
  slug: true,
  name: true,
  price: true,
  oldPrice: true,
  rating: true,
  ratingCount: true,
  soldCount: true,
  stockStatus: true,
  isNewArrival: true,
  isBestSeller: true,
  images: { orderBy: { sortOrder: "asc" }, take: 2, select: { url: true, alt: true } },
} satisfies Prisma.ProductSelect;

export type ProductCard = Prisma.ProductGetPayload<{ select: typeof PRODUCT_CARD_SELECT }>;

export type MenuNode = {
  id: string;
  slug: string;
  name: string;
  href: string;
  children: MenuNode[];
};

export async function getMenuTree(): Promise<MenuNode[]> {
  let cats: { id: string; slug: string; name: string; parentId: string | null }[] = [];
  try {
    cats = await db.category.findMany({
      where: { isActive: true, showInMenu: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, slug: true, name: true, parentId: true },
    });
  } catch {
    return [];
  }
  const bySlug = new Map<string, string>(cats.map((c) => [c.id, c.slug]));
  const roots: MenuNode[] = [];
  const nodeById = new Map<string, MenuNode>();
  for (const c of cats) {
    nodeById.set(c.id, { id: c.id, slug: c.slug, name: c.name, href: `/${c.slug}`, children: [] });
  }
  for (const c of cats) {
    const node = nodeById.get(c.id)!;
    if (c.parentId && nodeById.has(c.parentId)) {
      const parentSlug = bySlug.get(c.parentId)!;
      node.href = `/${parentSlug}/${c.slug}`;
      nodeById.get(c.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export async function getAllCategoriesFlat() {
  return db.category.findMany({
    orderBy: [{ sortOrder: "asc" }],
    select: { id: true, slug: true, name: true, parentId: true },
  });
}

export async function resolveCategory(slugs: string[]) {
  const leaf = slugs[slugs.length - 1];
  const cat = await db.category.findUnique({
    where: { slug: leaf },
    include: { parent: true, children: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
  });
  if (!cat || !cat.isActive) return null;
  return cat;
}

export type SortKey =
  | "default"
  | "name-asc"
  | "name-desc"
  | "price-asc"
  | "price-desc"
  | "rating-desc";

const SORT_MAP: Record<SortKey, Prisma.ProductOrderByWithRelationInput[]> = {
  default: [{ hasImage: "desc" }, { isBestSeller: "desc" }, { createdAt: "desc" }],
  "name-asc": [{ hasImage: "desc" }, { name: "asc" }],
  "name-desc": [{ hasImage: "desc" }, { name: "desc" }],
  "price-asc": [{ hasImage: "desc" }, { price: "asc" }],
  "price-desc": [{ hasImage: "desc" }, { price: "desc" }],
  "rating-desc": [{ hasImage: "desc" }, { rating: "desc" }, { ratingCount: "desc" }],
};

export async function getCategoryProducts(opts: {
  categoryId: string;
  includeDescendants?: boolean;
  page?: number;
  perPage?: number;
  sort?: SortKey;
  minPrice?: number;
  maxPrice?: number;
}) {
  const { categoryId, includeDescendants = true } = opts;
  const page = Math.max(1, opts.page ?? 1);
  const perPage = opts.perPage ?? 15;
  const sort = opts.sort ?? "default";

  let categoryIds = [categoryId];
  if (includeDescendants) {
    const kids = await db.category.findMany({
      where: { parentId: categoryId },
      select: { id: true },
    });
    categoryIds = [categoryId, ...kids.map((k) => k.id)];
  }

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    categories: { some: { categoryId: { in: categoryIds } } },
  };
  if (opts.minPrice != null || opts.maxPrice != null) {
    where.price = {};
    if (opts.minPrice != null) where.price.gte = opts.minPrice;
    if (opts.maxPrice != null) where.price.lte = opts.maxPrice;
  }

  const [total, items, priceAgg] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: SORT_MAP[sort],
      skip: (page - 1) * perPage,
      take: perPage,
      select: PRODUCT_CARD_SELECT,
    }),
    db.product.aggregate({
      where: { isActive: true, categories: { some: { categoryId: { in: categoryIds } } } },
      _min: { price: true },
      _max: { price: true },
    }),
  ]);

  return {
    items,
    total,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
    priceRange: { min: priceAgg._min.price ?? 0, max: priceAgg._max.price ?? 0 },
  };
}

export async function getProductBySlug(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      specs: { orderBy: { sortOrder: "asc" } },
      options: { orderBy: { sortOrder: "asc" }, include: { values: { orderBy: { sortOrder: "asc" } } } },
      categories: { include: { category: { include: { parent: true } } } },
      reviews: { where: { isApproved: true }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getRelatedProducts(productId: string, categoryIds: string[], take = 10) {
  return db.product.findMany({
    where: {
      isActive: true,
      id: { not: productId },
      categories: { some: { categoryId: { in: categoryIds } } },
    },
    orderBy: [{ hasImage: "desc" }, { isBestSeller: "desc" }, { createdAt: "desc" }],
    take,
    select: PRODUCT_CARD_SELECT,
  });
}

export async function getRail(kind: "best" | "new" | "rating" | "featured" | "trending", take = 12) {
  const where: Prisma.ProductWhereInput = { isActive: true };
  const orderBy: Prisma.ProductOrderByWithRelationInput[] = [
    { hasImage: "desc" },
    { createdAt: "desc" },
  ];
  if (kind === "best") where.isBestSeller = true;
  if (kind === "new") where.isNewArrival = true;
  if (kind === "featured") where.isFeatured = true;
  if (kind === "trending") where.isTrending = true;
  if (kind === "rating") {
    where.rating = { gt: 0 };
    orderBy.unshift({ rating: "desc" });
  }
  const items = await db.product.findMany({ where, orderBy, take, select: PRODUCT_CARD_SELECT });
  if (items.length === 0) {
    return db.product.findMany({
      where: { isActive: true },
      orderBy: [{ hasImage: "desc" }, { isBestSeller: "desc" }, { createdAt: "desc" }],
      take,
      select: PRODUCT_CARD_SELECT,
    });
  }
  return items;
}

export async function searchProducts(q: string, page = 1, perPage = 24) {
  const term = q.trim();
  if (!term) return { items: [], total: 0, page, pages: 1 };
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    OR: [
      { name: { contains: term } },
      { description: { contains: term } },
      { sku: { contains: term } },
    ],
  };
  const [total, items] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: [{ hasImage: "desc" }, { isBestSeller: "desc" }, { name: "asc" }],
      skip: (page - 1) * perPage,
      take: perPage,
      select: PRODUCT_CARD_SELECT,
    }),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / perPage)) };
}

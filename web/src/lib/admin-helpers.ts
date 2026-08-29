import { db } from "./db";
import type { ProductInitial } from "@/components/admin/ProductForm";

export async function getCategoriesForForm() {
  return db.category.findMany({
    orderBy: [{ sortOrder: "asc" }],
    select: { id: true, name: true, parentId: true },
  });
}

export const EMPTY_PRODUCT: ProductInitial = {
  name: "",
  slug: "",
  sku: "",
  price: 0,
  oldPrice: "",
  stockStatus: "In Stock",
  quantity: 100,
  shortDescription: "",
  description: "",
  metaTitle: "",
  metaDescription: "",
  isActive: true,
  isFeatured: false,
  isBestSeller: false,
  isNewArrival: false,
  isTrending: false,
  rating: 0,
  ratingCount: 0,
  soldCount: 0,
  images: [],
  specs: [],
  options: [
    {
      label: "Customization Method",
      type: "select",
      required: true,
      values: [
        { label: "Tailor Home Visit", priceDelta: 0 },
        { label: "Customization on Call", priceDelta: 0 },
        { label: "Ready to Ship (Standard Size)", priceDelta: 0 },
      ],
    },
  ],
  categoryIds: [],
};

export async function getProductForForm(id: string): Promise<ProductInitial | null> {
  const p = await db.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      specs: { orderBy: { sortOrder: "asc" } },
      options: {
        orderBy: { sortOrder: "asc" },
        include: { values: { orderBy: { sortOrder: "asc" } } },
      },
      categories: true,
    },
  });
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku ?? "",
    price: p.price,
    oldPrice: p.oldPrice ?? "",
    stockStatus: p.stockStatus,
    quantity: p.quantity,
    shortDescription: p.shortDescription ?? "",
    description: p.description ?? "",
    metaTitle: p.metaTitle ?? "",
    metaDescription: p.metaDescription ?? "",
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    isBestSeller: p.isBestSeller,
    isNewArrival: p.isNewArrival,
    isTrending: p.isTrending,
    rating: p.rating,
    ratingCount: p.ratingCount,
    soldCount: p.soldCount,
    images: p.images.map((i) => ({ url: i.url, alt: i.alt ?? "" })),
    specs: p.specs.map((s) => ({ key: s.key, value: s.value })),
    options: p.options.map((o) => ({
      label: o.label,
      type: o.type,
      required: o.required,
      values: o.values.map((v) => ({ label: v.label, priceDelta: v.priceDelta })),
    })),
    categoryIds: p.categories.map((c) => c.categoryId),
  };
}

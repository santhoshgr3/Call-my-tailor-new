"use server";

import { revalidatePath } from "next/cache";
import { bustStorefrontCache } from "@/lib/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

async function uniqueSlug(base: string, ignoreId?: string) {
  let slug = base || "category";
  let i = 2;
  while (true) {
    const existing = await db.category.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    slug = `${base}-${i++}`;
  }
}

function fields(fd: FormData) {
  const name = String(fd.get("name") || "").trim();
  return {
    name,
    slugInput: slugify(String(fd.get("slug") || "") || name),
    parentId: String(fd.get("parentId") || "") || null,
    description: String(fd.get("description") || "").trim() || null,
    descriptionHtml: String(fd.get("descriptionHtml") || "").trim() || null,
    image: String(fd.get("image") || "").trim() || null,
    metaTitle: String(fd.get("metaTitle") || "").trim() || null,
    metaDescription: String(fd.get("metaDescription") || "").trim() || null,
    sortOrder: Math.round(Number(fd.get("sortOrder") || 0)),
    isActive: fd.get("isActive") === "on",
    showInMenu: fd.get("showInMenu") === "on",
  };
}

export async function createCategory(fd: FormData) {
  await requireAdmin();
  const { slugInput, ...f } = fields(fd);
  if (!f.name) return;
  const slug = await uniqueSlug(slugInput);
  await db.category.create({ data: { ...f, slug } });
  bustStorefrontCache();
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategory(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (!id) return;
  const f = fields(fd);
  const slug = await uniqueSlug(f.slugInput, id);
  if (f.parentId === id) f.parentId = null;
  await db.category.update({
    where: { id },
    data: {
      name: f.name,
      slug,
      parentId: f.parentId,
      description: f.description,
      descriptionHtml: f.descriptionHtml,
      image: f.image,
      metaTitle: f.metaTitle,
      metaDescription: f.metaDescription,
      sortOrder: f.sortOrder,
      isActive: f.isActive,
      showInMenu: f.showInMenu,
    },
  });
  revalidatePath("/admin/categories");
  bustStorefrontCache();
  revalidatePath("/");
  redirect("/admin/categories");
}

export async function deleteCategory(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (!id) return;
  await db.category.updateMany({ where: { parentId: id }, data: { parentId: null } });
  await db.category.delete({ where: { id } });
  bustStorefrontCache();
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);
}

async function uniqueSlug(base: string, ignoreId?: string) {
  let slug = base || "post";
  let i = 2;
  while (true) {
    const ex = await db.blogPost.findUnique({ where: { slug } });
    if (!ex || ex.id === ignoreId) return slug;
    slug = `${base}-${i++}`;
  }
}

function fields(fd: FormData) {
  const title = String(fd.get("title") || "").trim();
  return {
    title,
    slugInput: slugify(String(fd.get("slug") || "") || title),
    subtitle: String(fd.get("subtitle") || "").trim() || null,
    author: String(fd.get("author") || "").trim() || "Call My Tailor",
    excerpt: String(fd.get("excerpt") || "").trim() || null,
    contentHtml: String(fd.get("contentHtml") || ""),
    coverImage: String(fd.get("coverImage") || "").trim() || null,
    metaTitle: String(fd.get("metaTitle") || "").trim() || null,
    metaDescription: String(fd.get("metaDescription") || "").trim() || null,
    isPublished: fd.get("isPublished") === "on",
  };
}

export async function saveBlogPost(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") || "");
  const { slugInput, ...f } = fields(fd);
  if (!f.title) return;
  const slug = await uniqueSlug(slugInput, id || undefined);
  if (id) {
    await db.blogPost.update({ where: { id }, data: { ...f, slug } });
  } else {
    await db.blogPost.create({ data: { ...f, slug } });
  }
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect("/admin/blog");
}

export async function deleteBlogPost(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (id) await db.blogPost.delete({ where: { id } });
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect("/admin/blog");
}

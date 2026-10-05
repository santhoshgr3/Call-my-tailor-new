"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { bustStorefrontCache } from "@/lib/cache";

const done = () => {
  bustStorefrontCache();
  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
};

const okUrl = (u: string) => /^(\/|https?:\/\/)/.test(u);

export async function addGalleryItems(urls: string[], category: string) {
  await requireAdmin();
  const clean = urls.filter((u) => typeof u === "string" && okUrl(u)).slice(0, 100);
  if (!clean.length) return;
  const cat = String(category || "").trim().slice(0, 40);
  const last = await db.galleryItem.aggregate({ _max: { sortOrder: true } });
  let order = (last._max.sortOrder ?? 0) + 1;
  await db.galleryItem.createMany({
    data: clean.map((imageUrl) => ({ imageUrl, category: cat, sortOrder: order++ })),
  });
  done();
}

export async function saveGalleryItem(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (!id) return;
  await db.galleryItem
    .update({
      where: { id },
      data: {
        category: String(fd.get("category") || "").trim().slice(0, 40),
        caption: String(fd.get("caption") || "").trim().slice(0, 150) || null,
        sortOrder: Math.round(Number(fd.get("sortOrder") || 0)) || 0,
        isActive: fd.get("isActive") === "on",
      },
    })
    .catch(() => null);
  done();
}

export async function deleteGalleryItem(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (id) await db.galleryItem.delete({ where: { id } }).catch(() => null);
  done();
}

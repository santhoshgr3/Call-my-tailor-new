"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { readSiteFresh } from "@/lib/site-admin";
import { resolveBooking } from "@/lib/settings";

const done = () => {
  revalidatePath("/admin/bookings/services");
  revalidatePath("/book-visit", "layout");
};

const int = (fd: FormData, key: string) => {
  const n = Math.round(Number(fd.get(key)));
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 10_000_000) : 0;
};
const text = (fd: FormData, key: string, max = 200) => String(fd.get(key) ?? "").trim().slice(0, max);

/** Only allow site-relative or http(s) image paths. */
function safeImage(v: string) {
  return /^(\/|https?:\/\/)/.test(v) ? v : "";
}

async function validCategory(slug: string) {
  const cfg = resolveBooking(await readSiteFresh());
  return cfg.categories.some((c) => c.slug === slug);
}

export async function saveService(fd: FormData) {
  await requireAdmin();
  const id = text(fd, "id", 60);
  const title = text(fd, "title");
  if (!id || !title) return;
  await db.serviceItem
    .update({
      where: { id },
      data: {
        title,
        subcategory: text(fd, "subcategory") || "General",
        stitching: int(fd, "stitching"),
        fabricFrom: int(fd, "fabricFrom"),
        badge: text(fd, "badge", 30) || null,
        image: safeImage(text(fd, "image", 1000)),
        sortOrder: int(fd, "sortOrder"),
        isActive: fd.get("isActive") === "on",
      },
    })
    .catch(() => null);
  done();
}

export async function addService(fd: FormData) {
  await requireAdmin();
  const category = text(fd, "category", 60);
  const title = text(fd, "title");
  if (!title || !(await validCategory(category))) return;
  const last = await db.serviceItem.aggregate({ where: { category }, _max: { sortOrder: true } });
  await db.serviceItem.create({
    data: {
      category,
      title,
      subcategory: text(fd, "subcategory") || "General",
      stitching: int(fd, "stitching"),
      fabricFrom: int(fd, "fabricFrom"),
      badge: text(fd, "badge", 30) || null,
      image: safeImage(text(fd, "image", 1000)),
      sortOrder: (last._max.sortOrder ?? 0) + 1,
    },
  });
  done();
}

export async function deleteService(fd: FormData) {
  await requireAdmin();
  const id = text(fd, "id", 60);
  if (id) await db.serviceItem.delete({ where: { id } }).catch(() => null);
  done();
}

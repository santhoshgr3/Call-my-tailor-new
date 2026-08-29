"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { setSetting } from "@/lib/settings";

const rv = () => {
  revalidatePath("/admin/homepage");
  revalidatePath("/");
};

// ---- Hero slides ----
export async function saveSlide(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") || "");
  const data = {
    imageUrl: String(fd.get("imageUrl") || "").trim(),
    headline: String(fd.get("headline") || "").trim() || null,
    subtext: String(fd.get("subtext") || "").trim() || null,
    link: String(fd.get("link") || "").trim() || null,
    sortOrder: Math.round(Number(fd.get("sortOrder") || 0)),
    isActive: fd.get("isActive") === "on",
  };
  if (!data.imageUrl) return;
  if (id) await db.heroSlide.update({ where: { id }, data });
  else await db.heroSlide.create({ data });
  rv();
}
export async function deleteSlide(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (id) await db.heroSlide.delete({ where: { id } });
  rv();
}

// ---- Promo banners ----
export async function saveBanner(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") || "");
  const data = {
    imageUrl: String(fd.get("imageUrl") || "").trim(),
    title: String(fd.get("title") || "").trim() || null,
    subtitle: String(fd.get("subtitle") || "").trim() || null,
    buttonLabel: String(fd.get("buttonLabel") || "").trim() || null,
    link: String(fd.get("link") || "").trim() || null,
    position: String(fd.get("position") || "home-top"),
    sortOrder: Math.round(Number(fd.get("sortOrder") || 0)),
    isActive: fd.get("isActive") === "on",
  };
  if (!data.imageUrl) return;
  if (id) await db.promoBanner.update({ where: { id }, data });
  else await db.promoBanner.create({ data });
  rv();
}
export async function deleteBanner(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (id) await db.promoBanner.delete({ where: { id } });
  rv();
}

// ---- Fabric brands ----
export async function saveBrand(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") || "");
  const data = {
    name: String(fd.get("name") || "").trim() || "Brand",
    logoUrl: String(fd.get("logoUrl") || "").trim(),
    sortOrder: Math.round(Number(fd.get("sortOrder") || 0)),
    isActive: fd.get("isActive") === "on",
  };
  if (!data.logoUrl) return;
  if (id) await db.fabricBrand.update({ where: { id }, data });
  else await db.fabricBrand.create({ data });
  rv();
}
export async function deleteBrand(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (id) await db.fabricBrand.delete({ where: { id } });
  rv();
}

// ---- Section toggles ----
export async function saveLayout(fd: FormData) {
  await requireAdmin();
  const keys = [
    "show_hero",
    "show_how_it_works",
    "show_specialization",
    "show_order_by_category",
    "show_rails",
    "show_why_choose_us",
    "show_trending",
    "show_made_cta",
    "show_fabric_brands",
    "show_testimonials",
    "show_stats",
    "show_latest_blog",
  ];
  const layout: Record<string, boolean> = {};
  for (const k of keys) layout[k] = fd.get(k) === "on";
  await setSetting("home_layout", layout);
  rv();
}

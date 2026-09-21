"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { patchSite, readSiteFresh, str, jsonField, cleanRows, cleanStrings } from "@/lib/site-admin";
import type { BookingConfig } from "@/lib/settings";

async function patchBooking(patch: Partial<BookingConfig>) {
  const site = await readSiteFresh();
  await patchSite({ booking: { ...(site.booking ?? {}), ...patch } });
  revalidatePath("/admin/bookings/settings");
  revalidatePath("/book-visit", "layout");
}

const img = (v: string) => (/^(\/|https?:\/\/)/.test(v) ? v : "");

export async function saveBookingHero(fd: FormData) {
  await requireAdmin();
  await patchBooking({
    eyebrow: str(fd, "eyebrow"),
    title_line1: str(fd, "title_line1"),
    title_accent: str(fd, "title_accent"),
    subtitle: str(fd, "subtitle"),
    body: str(fd, "body"),
    hero_image: img(str(fd, "hero_image")),
    cta_label: str(fd, "cta_label"),
    select_heading: str(fd, "select_heading"),
    select_intro: str(fd, "select_intro"),
    stats: cleanRows(jsonField(fd, "stats", []), ["value", "label"] as const).filter((r) => r.value && r.label),
  });
}

export async function saveBookingCategories(fd: FormData) {
  await requireAdmin();
  const rows = cleanRows(jsonField(fd, "categories", []), [
    "slug",
    "label",
    "desc",
    "subtitle",
    "image",
    "banner",
  ] as const)
    .map((r) => ({
      ...r,
      slug: r.slug.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, ""),
      image: img(r.image),
      banner: img(r.banner),
    }))
    .filter((r) => r.slug && r.label);
  // keep slugs unique
  const seen = new Set<string>();
  await patchBooking({ categories: rows.filter((r) => (seen.has(r.slug) ? false : (seen.add(r.slug), true))) });
}

export async function saveBookingSteps(fd: FormData) {
  await requireAdmin();
  await patchBooking({
    steps: cleanRows(jsonField(fd, "steps", []), ["title", "sub", "image"] as const)
      .filter((r) => r.title)
      .map((r) => ({ ...r, image: img(r.image) })),
    features: cleanRows(jsonField(fd, "features", []), ["icon", "title", "sub"] as const).filter((r) => r.title),
  });
}

export async function saveBookingPayment(fd: FormData) {
  await requireAdmin();
  const charge = Math.round(Number(fd.get("visit_charge")));
  const link = str(fd, "payment_link");
  await patchBooking({
    visit_charge: Number.isFinite(charge) && charge >= 0 ? Math.min(charge, 1_000_000) : 200,
    payment_link: /^https:\/\//.test(link) ? link : "",
    time_slots: cleanStrings(jsonField(fd, "time_slots", [])),
    notice: str(fd, "notice"),
  });
}

export async function saveBookingTexts(fd: FormData) {
  await requireAdmin();
  await patchBooking({
    form_eyebrow: str(fd, "form_eyebrow"),
    form_title: str(fd, "form_title"),
    empty_note: str(fd, "empty_note"),
    success_title: str(fd, "success_title"),
    success_steps: cleanStrings(jsonField(fd, "success_steps", [])),
  });
}

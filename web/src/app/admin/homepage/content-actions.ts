"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { patchSite, str, jsonField, cleanRows } from "@/lib/site-admin";

const done = () => revalidatePath("/admin/homepage/content");

export async function saveTitlesAndBackgrounds(fd: FormData) {
  await requireAdmin();
  await patchSite({
    titles: {
      how_it_works: str(fd, "t_how_it_works"),
      specialization: str(fd, "t_specialization"),
      order_by_category: str(fd, "t_order_by_category"),
      why_choose_us: str(fd, "t_why_choose_us"),
      trending: str(fd, "t_trending"),
      fabric_brands: str(fd, "t_fabric_brands"),
      testimonials: str(fd, "t_testimonials"),
      blog: str(fd, "t_blog"),
    },
    backgrounds: {
      why_choose: str(fd, "bg_why_choose"),
      made: str(fd, "bg_made"),
      stats: str(fd, "bg_stats"),
      fabric: str(fd, "bg_fabric"),
    },
  });
  done();
}

export async function saveHowItWorks(fd: FormData) {
  await requireAdmin();
  const rows = cleanRows(jsonField(fd, "how", []), ["title", "text", "icon"] as const);
  await patchSite({
    how_it_works: rows.map((r, i) => ({
      step: i + 1,
      title: r.title,
      text: r.text,
      ...(r.icon ? { icon: r.icon } : {}),
    })),
  });
  done();
}

export async function saveSpecializations(fd: FormData) {
  await requireAdmin();
  const rows = cleanRows(jsonField(fd, "items", []), ["title", "slug", "image"] as const).filter(
    (r) => r.title && r.slug,
  );
  await patchSite({
    specializations: rows.map((r) => ({
      title: r.title,
      slug: r.slug.replace(/^\/+/, ""),
      ...(r.image ? { image: r.image } : {}),
    })),
  });
  done();
}

export async function saveOrderByCategory(fd: FormData) {
  await requireAdmin();
  const rows = cleanRows(jsonField(fd, "items", []), ["label", "slug", "image"] as const).filter(
    (r) => r.label && r.slug,
  );
  await patchSite({
    order_by_category: rows.map((r) => ({
      label: r.label,
      slug: r.slug.replace(/^\/+/, ""),
      ...(r.image ? { image: r.image } : {}),
    })),
  });
  done();
}

export async function saveTrendingAndRails(fd: FormData) {
  await requireAdmin();
  const rows = cleanRows(jsonField(fd, "trending", []), ["label", "slug"] as const).filter(
    (r) => r.label && r.slug,
  );
  await patchSite({
    trending_categories: rows,
    product_rails: [str(fd, "rail_1"), str(fd, "rail_2"), str(fd, "rail_3")].map(
      (v, i) => v || ["Best Sellers", "New Arrivals", "Most Rating"][i],
    ),
  });
  done();
}

export async function saveWhyChooseUs(fd: FormData) {
  await requireAdmin();
  const rows = cleanRows(jsonField(fd, "items", []), ["icon", "title", "text"] as const).filter(
    (r) => r.title,
  );
  await patchSite({ why_choose_us: rows });
  done();
}

export async function saveMadeCta(fd: FormData) {
  await requireAdmin();
  const title = str(fd, "title");
  await patchSite({
    made_cta: title
      ? { title, text: str(fd, "text"), button: str(fd, "button"), link: str(fd, "link") }
      : null,
  });
  done();
}

export async function saveStats(fd: FormData) {
  await requireAdmin();
  await patchSite({
    stats: cleanRows(jsonField(fd, "items", []), ["value", "label"] as const).filter(
      (r) => r.value && r.label,
    ),
  });
  done();
}

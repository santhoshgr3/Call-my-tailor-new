"use server";

import { requireAdmin } from "@/lib/auth";
import { setSetting, DEFAULT_HOME_VISIT } from "@/lib/settings";
import { bustStorefrontCache } from "@/lib/cache";
import { revalidatePath } from "next/cache";
import { patchSite, readSiteFresh, str, jsonField, cleanRows, cleanStrings } from "@/lib/site-admin";

const SOCIAL_KEYS = ["instagram", "facebook", "linkedin", "youtube", "pinterest"] as const;

export async function saveGeneralSettings(fd: FormData) {
  await requireAdmin();
  const site = await readSiteFresh();

  const socials: Record<string, string> = {};
  for (const k of SOCIAL_KEYS) {
    const v = str(fd, `social_${k}`);
    if (v) socials[k] = v;
  }

  const displayPrice = Number(str(fd, "hv_price"));

  await patchSite({
    brand: str(fd, "brand") || site.brand,
    tagline: str(fd, "tagline"),
    logo: str(fd, "logo"),
    booking_url: str(fd, "booking_url") || site.booking_url,
    top_bar: cleanStrings(jsonField(fd, "top_bar", [])),
    top_tags: cleanStrings(jsonField(fd, "top_tags", [])),
    header_links: cleanRows(jsonField(fd, "header_links", []), ["label", "href"] as const).filter(
      (l) => l.label && l.href,
    ),
    socials,
    contact: {
      ...site.contact,
      address: str(fd, "c_address"),
      phone: str(fd, "c_phone"),
      phone_raw: str(fd, "c_phone_raw"),
      whatsapp: str(fd, "c_whatsapp"),
      email: str(fd, "c_email"),
      alt_email: str(fd, "c_alt_email") || undefined,
      hours: str(fd, "c_hours"),
      people: cleanRows(jsonField(fd, "c_people", []), ["role", "name"] as const),
    },
    home_visit: {
      option_label: str(fd, "hv_label") || DEFAULT_HOME_VISIT.option_label,
      display_price: Number.isFinite(displayPrice) ? Math.max(0, displayPrice) : 0,
      note: str(fd, "hv_note"),
    },
  });

  await setSetting("seo", {
    default_title: str(fd, "seo_title"),
    default_description: str(fd, "seo_desc"),
  });
  bustStorefrontCache();
  revalidatePath("/admin/settings");
}

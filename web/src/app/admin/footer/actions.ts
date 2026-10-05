"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { patchSite, str, jsonField, cleanRows } from "@/lib/site-admin";

type LinkRow = { text: string; href: string };

export async function saveFooter(fd: FormData) {
  await requireAdmin();

  const rawColumns = jsonField<{ title?: unknown; links?: unknown }[]>(fd, "columns", []);
  const columns = (Array.isArray(rawColumns) ? rawColumns : [])
    .map((c) => ({
      title: String(c?.title ?? "").trim(),
      links: cleanRows(c?.links, ["text", "href"] as const).filter((l) => l.text && l.href) as LinkRow[],
    }))
    .filter((c) => c.title);

  const gallery = cleanRows(jsonField(fd, "gallery", []), ["image", "href"] as const).filter(
    (g) => g.image,
  );
  const moreImage = str(fd, "more_image");

  await patchSite({
    newsletter_heading: str(fd, "newsletter_heading"),
    whatsapp_channel: {
      enabled: fd.get("wc_enabled") === "on",
      heading: str(fd, "wc_heading"),
      text: str(fd, "wc_text"),
      button: str(fd, "wc_button"),
      url: /^https?:\/\//.test(str(fd, "wc_url")) ? str(fd, "wc_url") : "",
    },
    footer_video: str(fd, "footer_video") || null,
    footer_columns: columns,
    footer_gallery: gallery,
    footer_gallery_more: moreImage ? { image: moreImage, href: str(fd, "more_href") } : null,
    footer_tags: cleanRows(jsonField(fd, "tags", []), ["text", "href"] as const).filter(
      (t) => t.text && t.href,
    ),
    copyright: str(fd, "copyright"),
  });
  revalidatePath("/admin/footer");
}

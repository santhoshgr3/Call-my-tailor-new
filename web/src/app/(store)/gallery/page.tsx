import type { Metadata } from "next";
import { db } from "@/lib/db";
import { GalleryView } from "@/components/home/GalleryView";
import { LegacyShell } from "@/components/legacy/LegacyPage";
import { splitLegacyHtml } from "@/lib/legacy-css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Tailoring Gallery | Custom Suits, Sherwanis & Kurtas",
  description: "Suits, sherwanis, kurta jackets and more — see what we have tailored for our customers.",
};

export default async function GalleryPage() {
  const [items, page] = await Promise.all([
    db.galleryItem
      .findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        select: { id: true, imageUrl: true, category: true, caption: true },
      })
      .catch(() => []),
    db.infoPage.findUnique({ where: { slug: "gallery" } }).catch(() => null),
  ]);
  // the old page's own CSS (banner image, pills, cards) is kept in the stored "gallery" page
  const css = page ? splitLegacyHtml(page.contentHtml).css : "";
  return (
    <LegacyShell css={css}>
      <div className="pricelist-area">
        <div className="container-fluid banner_img"> </div>
        <GalleryView items={items} />
      </div>
    </LegacyShell>
  );
}

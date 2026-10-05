import type { Metadata } from "next";
import { db } from "@/lib/db";
import { GalleryView } from "@/components/home/GalleryView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Our Work — Gallery",
  description: "Suits, sherwanis, kurta jackets and more — see what we have tailored for our customers.",
};

export default async function GalleryPage() {
  const items = await db.galleryItem
    .findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: { id: true, imageUrl: true, category: true, caption: true },
    })
    .catch(() => []);
  return (
    <div className="container-cmt py-8">
      <h1 className="section-title mb-6">Our Work</h1>
      <GalleryView items={items} />
    </div>
  );
}

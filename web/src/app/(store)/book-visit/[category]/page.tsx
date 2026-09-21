import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSiteConfig, resolveBooking } from "@/lib/settings";
import { CatalogView } from "@/components/booking/CatalogView";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cfg = resolveBooking(await getSiteConfig());
  const cat = cfg.categories.find((c) => c.slug === category);
  return { title: cat ? `${cat.label} — Book a Home Visit` : "Book a Home Visit" };
}

export default async function BookingCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cfg = resolveBooking(await getSiteConfig());
  const cat = cfg.categories.find((c) => c.slug === category);
  if (!cat) notFound();

  const items = await db.serviceItem
    .findMany({
      where: { category: cat.slug, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      select: {
        id: true,
        subcategory: true,
        title: true,
        stitching: true,
        fabricFrom: true,
        badge: true,
        image: true,
      },
    })
    .catch(() => []);

  return <CatalogView category={cat} items={items} categories={cfg.categories} />;
}

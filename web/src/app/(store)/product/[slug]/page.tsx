import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { pageTitle } from "@/lib/seo";
import { getSiteConfig } from "@/lib/settings";
import { formatINR } from "@/lib/money";
import { Stars } from "@/components/ui/Stars";
import { ProductGallery } from "@/components/product/ProductGallery";
import { BuyBox } from "@/components/product/BuyBox";
import { ProductTabsView } from "@/components/product/ProductTabsView";
import { ProductCard } from "@/components/product/ProductCard";
import { dbStatus } from "@/lib/health";
import { SetupNotice } from "@/components/SetupNotice";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product not found" };
  return {
    title: pageTitle(p.metaTitle || p.name),
    description: p.metaDescription || p.shortDescription || undefined,
    openGraph: { images: p.images[0]?.url ? [p.images[0].url] : [] },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const status = await dbStatus();
  if (status !== "ok") return <SetupNotice status={status} />;

  const p = await getProductBySlug(slug);
  if (!p || !p.isActive) notFound();

  const site = await getSiteConfig();
  const categoryIds = p.categories.map((c) => c.categoryId);
  const related = await getRelatedProducts(p.id, categoryIds, 10);

  const primaryCat = p.categories[0]?.category;
  const parentCat = primaryCat?.parent;

  return (
    <div className="container-cmt py-8">
      <nav className="mb-5 text-xs text-faint">
        <Link href="/" className="hover:text-brand">
          Home
        </Link>
        {parentCat && (
          <>
            {" / "}
            <Link href={`/${parentCat.slug}`} className="hover:text-brand">
              {parentCat.name}
            </Link>
          </>
        )}
        {primaryCat && (
          <>
            {" / "}
            <Link
              href={parentCat ? `/${parentCat.slug}/${primaryCat.slug}` : `/${primaryCat.slug}`}
              className="hover:text-brand"
            >
              {primaryCat.name}
            </Link>
          </>
        )}
        {" / "}
        <span className="text-ink">{p.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,480px)_1fr]">
        <ProductGallery images={p.images} name={p.name} />

        <div>
          <h1 className="text-2xl">{p.name}</h1>
          <div className="mt-2 flex items-center gap-3">
            <Stars value={p.rating} count={p.ratingCount || undefined} />
            {p.soldCount > 0 && (
              <span className="text-xs text-faint">· {p.soldCount} sold</span>
            )}
          </div>

          <div className="mt-4 flex items-end gap-3">
            <span className="text-3xl font-extrabold text-brand">{formatINR(p.price)}</span>
            {p.oldPrice ? (
              <span className="text-base text-faint line-through">{formatINR(p.oldPrice)}</span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-faint">Ex Tax: {formatINR(p.price)}</p>

          <dl className="mt-4 space-y-1 text-sm">
            {p.sku && (
              <div className="flex gap-2">
                <dt className="text-faint">Product Code:</dt>
                <dd className="font-semibold">{p.sku}</dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt className="text-faint">Availability:</dt>
              <dd className="font-semibold text-green-600">{p.stockStatus}</dd>
            </div>
          </dl>

          {p.shortDescription && (
            <p className="mt-4 text-sm text-muted">{p.shortDescription}</p>
          )}

          <hr className="my-5 border-line" />

          <BuyBox
            product={{
              productId: p.id,
              slug: p.slug,
              name: p.name,
              price: p.price,
              image: p.images[0]?.url || "/img/placeholder.svg",
            }}
            options={p.options.map((o) => ({
              id: o.id,
              label: o.label,
              required: o.required,
              values: o.values.map((v) => ({
                id: v.id,
                label: v.label,
                priceDelta: v.priceDelta,
              })),
            }))}
            bookingUrl={site.booking_url || "/book-visit"}
          />
        </div>
      </div>

      <ProductTabsView
        productId={p.id}
        descriptionHtml={p.descriptionHtml || `<p>${p.description ?? ""}</p>`}
        specs={p.specs.map((s) => ({ key: s.key, value: s.value }))}
        reviews={p.reviews}
      />

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="section-title">Related Products</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {related.slice(0, 10).map((rp) => (
              <ProductCard key={rp.id} p={rp} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { pageTitle } from "@/lib/seo";
import { getSiteConfig, DEFAULT_HOME_VISIT } from "@/lib/settings";
import { getPlugins } from "@/lib/plugins";
import { ProductJsonLd } from "@/components/plugins/PluginScripts";
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

  const [site, plugins] = await Promise.all([getSiteConfig(), getPlugins()]);
  const seoPlugin = plugins["structured-data"];
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const categoryIds = p.categories.map((c) => c.categoryId);
  const related = await getRelatedProducts(p.id, categoryIds, 10);

  const primaryCat = p.categories[0]?.category;
  const parentCat = primaryCat?.parent;

  return (
    <div className="container-cmt py-8">
      {seoPlugin.enabled && seoPlugin.config.product_schema !== false && (
        <ProductJsonLd
          baseUrl={baseUrl}
          product={{
            slug: p.slug,
            name: p.name,
            description: p.shortDescription || p.description,
            sku: p.sku,
            price: p.price,
            inStock: !/out of stock/i.test(p.stockStatus),
            images: p.images.map((i) => i.url),
            rating: p.rating,
            ratingCount: p.ratingCount,
          }}
        />
      )}
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

          {(() => {
            const KEYS = ["Color", "Fabric Brand", "Material Quality", "Fabric Pattern", "Ideal For"];
            const rows = KEYS.map((k) => p.specs.find((s) => s.key === k)).filter(
              (s): s is NonNullable<typeof s> => !!s,
            );
            if (rows.length === 0) return null;
            return (
              <dl className="mt-4 space-y-1 text-sm">
                {rows.map((s) => (
                  <div key={s.key} className="flex gap-2">
                    <dt className="text-faint">{s.key}:</dt>
                    <dd className="font-semibold">{s.value}</dd>
                  </div>
                ))}
              </dl>
            );
          })()}

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
            oldPrice={p.oldPrice}
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
            homeVisit={site.home_visit ?? DEFAULT_HOME_VISIT}
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

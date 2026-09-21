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

  const spec = (...keys: string[]) =>
    p.specs.find((s) => keys.includes(s.key.trim().toLowerCase()))?.value || null;
  const brand = spec("fabric brand", "brand");
  const model = spec("model", "model no", "model number");
  const unit = p.options.some((o) => /cut length|length|meter|metre/i.test(o.label)) ? "Per Meter" : null;
  const tagCats = p.categories.map((c) => c.category);

  return (
    <div>
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

      {/* Title bar */}
      <div className="border-b border-line bg-gradient-to-b from-white to-[#ececec]">
        <div className="container-cmt pt-5">
          <h1 className="pb-3 text-[22px] font-bold leading-snug text-ink sm:text-[30px]">{p.name}</h1>
          <span className="block h-[2px] w-[120px] bg-brand" />
        </div>
      </div>

      <div className="container-cmt py-6">
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

        <div className="grid gap-8 lg:grid-cols-[minmax(0,600px)_minmax(0,1fr)] lg:gap-10">
          <ProductGallery images={p.images} name={p.name} badge={p.isNewArrival ? "New" : undefined} />

          <div className="min-w-0">
            <ProductTabsView
              productId={p.id}
              descriptionHtml={p.descriptionHtml || `<p>${p.description ?? p.shortDescription ?? ""}</p>`}
              specs={p.specs.map((s) => ({ key: s.key, value: s.value }))}
              reviews={p.reviews}
            />

            <div className="mt-4">
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
                stock={p.stockStatus}
                sku={p.sku}
                model={model}
                brand={brand}
                unit={unit}
                whatsapp={site.contact?.whatsapp}
              />
            </div>
          </div>
        </div>

        {tagCats.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-bold text-ink">Tags:</span>
            {tagCats.map((c) => (
              <Link
                key={c.id}
                href={c.parent ? `/${c.parent.slug}/${c.slug}` : `/${c.slug}`}
                className="rounded-full bg-[#2d3440] px-3 py-1 text-[13px] font-medium text-white hover:bg-brand"
              >
                {c.name.toLowerCase()}
              </Link>
            ))}
          </div>
        )}

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
    </div>
  );
}

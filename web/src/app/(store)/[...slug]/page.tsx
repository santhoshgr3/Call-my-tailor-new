import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { resolveCategory, getCategoryProducts, type SortKey } from "@/lib/catalog";
import { ProductCard } from "@/components/product/ProductCard";
import { Pagination } from "@/components/catalog/Pagination";
import { SortSelect } from "@/components/catalog/SortSelect";
import { pageTitle } from "@/lib/seo";

type Params = { slug: string[] };
type Search = { [k: string]: string | string[] | undefined };

async function loadCategory(slug: string[]) {
  if (slug.length > 2) return null;
  const cat = await resolveCategory(slug);
  if (!cat) return null;
  // verify parent path if 2 segments
  if (slug.length === 2 && cat.parent?.slug !== slug[0]) return null;
  return cat;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = await loadCategory(slug);
  if (cat) {
    return {
      title: pageTitle(cat.metaTitle || cat.name),
      description: cat.metaDescription || undefined,
    };
  }
  const page = await db.infoPage.findUnique({ where: { slug: slug[0] } });
  if (page) {
    return { title: pageTitle(page.metaTitle || page.title), description: page.metaDescription || undefined };
  }
  return { title: "Not found" };
}

export default async function CatchAllPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const cat = await loadCategory(slug);

  if (cat) return <CategoryView cat={cat} sp={sp} basePath={"/" + slug.join("/")} />;

  if (slug.length === 1) {
    const page = await db.infoPage.findUnique({ where: { slug: slug[0], isPublished: true } });
    if (page) {
      return (
        <article className="container-cmt py-10">
          <nav className="mb-4 text-xs text-faint">
            <Link href="/" className="hover:text-brand">
              Home
            </Link>{" "}
            / <span className="text-ink">{page.title}</span>
          </nav>
          <h1 className="mb-6 text-3xl">{page.title}</h1>
          <div
            className="prose-cmt max-w-none text-sm text-muted"
            dangerouslySetInnerHTML={{ __html: page.contentHtml }}
          />
        </article>
      );
    }
  }
  notFound();
}

async function CategoryView({
  cat,
  sp,
  basePath,
}: {
  cat: NonNullable<Awaited<ReturnType<typeof resolveCategory>>>;
  sp: Search;
  basePath: string;
}) {
  const page = Math.max(1, parseInt((sp.page as string) || "1", 10) || 1);
  const sort = ((sp.sort as string) || "default") as SortKey;
  const perPage = [15, 25, 50, 75, 100].includes(Number(sp.show)) ? Number(sp.show) : 15;
  const minPrice = sp.min ? Number(sp.min) : undefined;
  const maxPrice = sp.max ? Number(sp.max) : undefined;

  const result = await getCategoryProducts({
    categoryId: cat.id,
    page,
    perPage,
    sort,
    minPrice,
    maxPrice,
  });

  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    if (sort !== "default") params.set("sort", sort);
    if (perPage !== 15) params.set("show", String(perPage));
    if (minPrice != null) params.set("min", String(minPrice));
    if (maxPrice != null) params.set("max", String(maxPrice));
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const from = result.total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(result.total, page * perPage);

  return (
    <div className="container-cmt py-8">
      <nav className="mb-4 text-xs text-faint">
        <Link href="/" className="hover:text-brand">
          Home
        </Link>
        {cat.parent && (
          <>
            {" / "}
            <Link href={`/${cat.parent.slug}`} className="hover:text-brand">
              {cat.parent.name}
            </Link>
          </>
        )}
        {" / "}
        <span className="text-ink">{cat.name}</span>
      </nav>

      <h1 className="mb-2 text-2xl uppercase">{cat.name}</h1>
      {cat.description && <p className="mb-4 max-w-3xl text-sm text-muted">{cat.description}</p>}

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* sidebar */}
        <aside className="space-y-6">
          <div>
            <h3 className="mb-2 border-b border-line pb-2 text-sm font-bold uppercase">
              Categories
            </h3>
            <ul className="space-y-1 text-sm">
              {cat.parent && (
                <li>
                  <Link href={`/${cat.parent.slug}`} className="text-muted hover:text-brand">
                    ← All {cat.parent.name}
                  </Link>
                </li>
              )}
              {cat.children.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/${cat.slug}/${c.slug}`}
                    className="text-muted hover:text-brand"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
              {cat.children.length === 0 && !cat.parent && (
                <li className="text-xs text-faint">No sub-categories</li>
              )}
            </ul>
          </div>

          <form className="text-sm" action={basePath}>
            <h3 className="mb-2 border-b border-line pb-2 text-sm font-bold uppercase">
              Price (₹)
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="min"
                defaultValue={minPrice}
                placeholder={String(result.priceRange.min)}
                className="w-full border border-line px-2 py-1"
              />
              <span>–</span>
              <input
                type="number"
                name="max"
                defaultValue={maxPrice}
                placeholder={String(result.priceRange.max)}
                className="w-full border border-line px-2 py-1"
              />
            </div>
            {sort !== "default" && <input type="hidden" name="sort" value={sort} />}
            <button className="btn-outline mt-2 w-full !py-1.5 !text-[11px]">Apply</button>
          </form>
        </aside>

        {/* products */}
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-line bg-soft px-3 py-2">
            <SortSelect sort={sort} perPage={perPage} />
            <p className="text-xs text-faint">
              Showing {from} to {to} of {result.total} ({result.pages} Pages)
            </p>
          </div>

          {result.items.length === 0 ? (
            <p className="py-16 text-center text-sm text-faint">
              No products found in this category.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {result.items.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          )}

          <Pagination page={result.page} pages={result.pages} makeHref={makeHref} />
        </div>
      </div>
    </div>
  );
}

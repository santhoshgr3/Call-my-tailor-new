import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { resolveCategory, getCategoryProducts, getCategoryFacets, type SortKey } from "@/lib/catalog";
import { ProductCard } from "@/components/product/ProductCard";
import { Pagination } from "@/components/catalog/Pagination";
import { SortSelect } from "@/components/catalog/SortSelect";
import { PriceRangeSlider } from "@/components/catalog/PriceRangeSlider";
import { pageTitle } from "@/lib/seo";
import { dbStatus } from "@/lib/health";
import { SetupNotice } from "@/components/SetupNotice";

async function safeInfoPage(slug: string) {
  try {
    return await db.infoPage.findUnique({ where: { slug, isPublished: true } });
  } catch {
    return null;
  }
}

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
  const page = await safeInfoPage(slug[0]);
  if (page) {
    return { title: pageTitle(page.metaTitle || page.title), description: page.metaDescription || undefined };
  }
  return { title: "Call My Tailor" };
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

  const status = await dbStatus();
  if (status !== "ok") return <SetupNotice status={status} />;

  const cat = await loadCategory(slug);

  if (cat) return <CategoryView cat={cat} sp={sp} basePath={"/" + slug.join("/")} />;

  if (slug.length === 1) {
    const page = await safeInfoPage(slug[0]);
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
  const q = (sp.q as string) || "";
  const manufacturer = (sp.mfr as string) || "";
  const weaveOnly = sp.weave === "1";
  const cols = [2, 3, 4, 5].includes(Number(sp.cols)) ? Number(sp.cols) : 4;

  const [result, facets] = await Promise.all([
    getCategoryProducts({
      categoryId: cat.id,
      page,
      perPage,
      sort,
      minPrice,
      maxPrice,
      q: q || undefined,
      manufacturer: manufacturer || undefined,
      weaveOnly: weaveOnly || undefined,
    }),
    getCategoryFacets(cat.id),
  ]);

  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    if (sort !== "default") params.set("sort", sort);
    if (perPage !== 15) params.set("show", String(perPage));
    if (minPrice != null) params.set("min", String(minPrice));
    if (maxPrice != null) params.set("max", String(maxPrice));
    if (q) params.set("q", q);
    if (manufacturer) params.set("mfr", manufacturer);
    if (weaveOnly) params.set("weave", "1");
    if (cols !== 3) params.set("cols", String(cols));
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const colsHref = (c: number) => {
    const params = new URLSearchParams();
    if (sort !== "default") params.set("sort", sort);
    if (perPage !== 15) params.set("show", String(perPage));
    if (minPrice != null) params.set("min", String(minPrice));
    if (maxPrice != null) params.set("max", String(maxPrice));
    if (q) params.set("q", q);
    if (manufacturer) params.set("mfr", manufacturer);
    if (weaveOnly) params.set("weave", "1");
    if (c !== 3) params.set("cols", String(c));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const from = result.total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(result.total, page * perPage);

  const gridColsClass: Record<number, string> = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  };

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

      {cat.description && <p className="mb-4 max-w-3xl text-sm text-muted">{cat.description}</p>}

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* sidebar */}
        <aside className="space-y-5">
          <h3 className="border-b-2 border-brand pb-2 text-sm font-bold uppercase">Shop By</h3>

          {cat.children.length > 0 && (
            <div>
              <h4 className="mb-2 border-b border-line pb-2 text-xs font-bold uppercase text-faint">
                Categories
              </h4>
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
                    <Link href={`/${cat.slug}/${c.slug}`} className="text-muted hover:text-brand">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form className="text-sm" action={basePath}>
            <div className="flex items-center border border-line">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search product..."
                className="w-full px-2 py-1.5 outline-none"
              />
              <button
                type="submit"
                aria-label="Search"
                className="grid h-8 w-9 shrink-0 place-items-center text-muted hover:text-brand"
              >
                🔍
              </button>
            </div>
          </form>

          {facets.weaveCount > 0 && (
            <div>
              <h4 className="mb-2 border-b border-line pb-2 text-xs font-bold uppercase text-faint">
                Fabric Weave
              </h4>
              <Link
                href={weaveOnly ? colsHref(cols) : `${basePath}?weave=1`}
                className="flex items-center justify-between gap-2 text-sm text-muted hover:text-brand"
              >
                <span className="flex items-center gap-2">
                  <input type="checkbox" readOnly checked={weaveOnly} className="accent-brand" />
                  Fabric Weave
                </span>
                <span className="rounded bg-soft px-1.5 py-0.5 text-[11px] text-faint">
                  {facets.weaveCount}
                </span>
              </Link>
            </div>
          )}

          {facets.manufacturers.length > 0 && (
            <div>
              <h4 className="mb-2 border-b border-line pb-2 text-xs font-bold uppercase text-faint">
                Manufacturer
              </h4>
              <ul className="space-y-1.5 text-sm">
                {facets.manufacturers.map((m) => {
                  const active = manufacturer === m.name;
                  const href = active
                    ? colsHref(cols)
                    : `${basePath}?${new URLSearchParams({ mfr: m.name }).toString()}`;
                  return (
                    <li key={m.name}>
                      <Link
                        href={href}
                        className="flex items-center justify-between gap-2 text-muted hover:text-brand"
                      >
                        <span className="flex items-center gap-2">
                          <input type="checkbox" readOnly checked={active} className="accent-brand" />
                          {m.name.toUpperCase()}
                        </span>
                        <span className="rounded bg-soft px-1.5 py-0.5 text-[11px] text-faint">
                          {m.count}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <form className="text-sm" action={basePath}>
            <h4 className="mb-3 border-b border-line pb-2 text-xs font-bold uppercase text-faint">
              Price
            </h4>
            <PriceRangeSlider
              min={result.priceRange.min}
              max={result.priceRange.max}
              low={minPrice ?? result.priceRange.min}
              high={maxPrice ?? result.priceRange.max}
            />
            {sort !== "default" && <input type="hidden" name="sort" value={sort} />}
            {manufacturer && <input type="hidden" name="mfr" value={manufacturer} />}
            {weaveOnly && <input type="hidden" name="weave" value="1" />}
            <button className="btn-outline mt-3 w-full !py-1.5 !text-[11px]">Apply</button>
          </form>

          {(q || manufacturer || weaveOnly || minPrice != null || maxPrice != null) && (
            <Link
              href={basePath}
              className="block w-full bg-soft py-2 text-center text-[11px] font-bold uppercase text-muted hover:bg-brand hover:text-white"
            >
              Reset All
            </Link>
          )}
        </aside>

        {/* products */}
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-line bg-soft px-3 py-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase text-faint">Grid View:</span>
              <div className="flex items-center gap-1">
                {[2, 3, 4, 5].map((c) => (
                  <Link
                    key={c}
                    href={colsHref(c)}
                    className={`grid h-6 w-6 place-items-center border text-xs ${
                      cols === c
                        ? "border-brand bg-brand text-white"
                        : "border-line text-muted hover:border-brand hover:text-brand"
                    }`}
                  >
                    {c}
                  </Link>
                ))}
              </div>
            </div>
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
            <div className={`grid gap-3 ${gridColsClass[cols]}`}>
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

import Link from "next/link";
import type { Metadata } from "next";
import { searchProducts } from "@/lib/catalog";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/product/ProductCard";
import { Pagination } from "@/components/catalog/Pagination";
import { dbStatus } from "@/lib/health";
import { SetupNotice } from "@/components/SetupNotice";

export const metadata: Metadata = { title: "Search" };
export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const status = await dbStatus();
  if (status !== "ok") return <SetupNotice status={status} />;

  const q = (sp.q || "").trim();
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);

  let result = await searchProducts(q, page);

  // optional category narrowing
  if (sp.category) {
    const cat = await db.category
      .findUnique({ where: { slug: sp.category }, select: { id: true } })
      .catch(() => null);
    if (cat) {
      const filtered = await db.product.findMany({
        where: {
          isActive: true,
          categories: { some: { categoryId: cat.id } },
          OR: q
            ? [{ name: { contains: q } }, { description: { contains: q } }]
            : undefined,
        },
        take: 48,
        orderBy: { name: "asc" },
        select: {
          id: true,
          slug: true,
          name: true,
          price: true,
          oldPrice: true,
          rating: true,
          ratingCount: true,
          soldCount: true,
          stockStatus: true,
          isNewArrival: true,
          isBestSeller: true,
          images: { orderBy: { sortOrder: "asc" }, take: 2, select: { url: true, alt: true } },
        },
      }).catch(() => []);
      result = { items: filtered, total: filtered.length, page: 1, pages: 1 };
    }
  }

  const makeHref = (p: number) =>
    `/search?q=${encodeURIComponent(q)}${sp.category ? `&category=${sp.category}` : ""}${
      p > 1 ? `&page=${p}` : ""
    }`;

  return (
    <div className="container-cmt py-10">
      <h1 className="text-2xl">
        Search results {q && <span className="text-brand">for “{q}”</span>}
      </h1>
      <p className="mt-1 text-sm text-faint">{result.total} products found</p>

      {result.items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-faint">No products matched your search.</p>
          <Link href="/" className="btn-outline mt-4">
            Back to Home
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {result.items.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
          <Pagination page={result.page} pages={result.pages} makeHref={makeHref} />
        </>
      )}
    </div>
  );
}

import Link from "next/link";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

async function approveReview(fd: FormData) {
  "use server";
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (id) await db.review.update({ where: { id }, data: { isApproved: true } });
  revalidatePath("/admin/reviews");
}

async function deleteReview(fd: FormData) {
  "use server";
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (id) await db.review.delete({ where: { id } });
  revalidatePath("/admin/reviews");
}

export default async function AdminReviews({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const sp = await searchParams;
  const showApproved = sp.filter === "approved";
  const reviews = await db.review.findMany({
    where: { isApproved: showApproved },
    orderBy: { createdAt: "desc" },
    include: { product: { select: { slug: true, name: true } } },
  });

  return (
    <div>
      <PageHeader title="Reviews" subtitle="Moderate customer product reviews" />

      <div className="mb-4 flex gap-2 text-xs">
        <Link
          href="/admin/reviews"
          className={`rounded border px-3 py-1.5 ${
            !showApproved ? "border-brand bg-brand text-white" : "border-line"
          }`}
        >
          Pending
        </Link>
        <Link
          href="/admin/reviews?filter=approved"
          className={`rounded border px-3 py-1.5 ${
            showApproved ? "border-brand bg-brand text-white" : "border-line"
          }`}
        >
          Approved
        </Link>
      </div>

      <div className="space-y-3">
        {reviews.length === 0 && (
          <p className="rounded-lg border border-line bg-white p-8 text-center text-sm text-faint">
            Nothing here.
          </p>
        )}
        {reviews.map((r) => (
          <div key={r.id} className="rounded-lg border border-line bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-amber-400">
                  {"★".repeat(r.rating)}
                  <span className="text-line">{"★".repeat(5 - r.rating)}</span>
                  <span className="ml-2 text-sm font-bold text-ink">{r.customerName}</span>
                </p>
                <p className="text-xs text-faint">
                  on{" "}
                  <Link href={`/product/${r.product.slug}`} className="text-brand hover:underline">
                    {r.product.name}
                  </Link>{" "}
                  · {new Date(r.createdAt).toLocaleDateString("en-IN")}
                </p>
                {r.title && <p className="mt-1 text-sm font-semibold">{r.title}</p>}
                <p className="mt-1 text-sm text-muted">{r.body}</p>
              </div>
              <div className="flex gap-2">
                {!r.isApproved && (
                  <form action={approveReview}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="btn-brand !py-1.5 !text-[11px]">Approve</button>
                  </form>
                )}
                <form action={deleteReview}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="btn-outline !py-1.5 !text-[11px]">Delete</button>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

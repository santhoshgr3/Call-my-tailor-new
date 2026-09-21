import Link from "next/link";
import { db } from "@/lib/db";
import { getSiteConfig, resolveBooking } from "@/lib/settings";
import { PageHeader, Card, Field, inputCls, SubmitButton } from "@/components/admin/ui";
import { ImageField } from "@/components/admin/ImageField";
import { BookingTabs } from "@/components/admin/BookingTabs";
import { saveService, addService, deleteService } from "./actions";

export const dynamic = "force-dynamic";

const BADGES = ["Bestseller", "Premium", "New", "Trending", "Popular"];

export default async function AdminServices({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const sp = await searchParams;
  const cfg = resolveBooking(await getSiteConfig());
  const cats = cfg.categories;
  const current = cats.find((c) => c.slug === sp.cat) ?? cats[0];
  const items = current
    ? await db.serviceItem.findMany({
        where: { category: current.slug },
        orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      })
    : [];

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title="Services & prices"
        subtitle="Items customers can pick on the home-visit booking page. Prices here are the ones charged — the booking form always re-reads them."
      />
      <BookingTabs />

      <div className="flex flex-wrap gap-2">
        {cats.map((c) => (
          <Link
            key={c.slug}
            href={`/admin/bookings/services?cat=${c.slug}`}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              current?.slug === c.slug
                ? "border-brand bg-brand text-white"
                : "border-line bg-white text-muted hover:border-brand"
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {!current ? (
        <p className="text-sm text-faint">Add a category under “Booking page” first.</p>
      ) : (
        <>
          <Card>
            <form action={addService} className="space-y-3">
              <input type="hidden" name="category" value={current.slug} />
              <h2 className="font-bold">Add an item to {current.label}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Title">
                  <input name="title" required className={inputCls} />
                </Field>
                <Field label="Section" hint="Filter tab on the page, e.g. Kurta Pajama">
                  <input name="subcategory" className={inputCls} />
                </Field>
                <Field label="Stitching price (₹)">
                  <input name="stitching" type="number" min={0} defaultValue={0} className={inputCls} />
                </Field>
                <Field label="Fabric starts at (₹)" hint="0 hides the line">
                  <input name="fabricFrom" type="number" min={0} defaultValue={0} className={inputCls} />
                </Field>
                <Field label="Badge">
                  <select name="badge" className={inputCls} defaultValue="">
                    <option value="">None</option>
                    {BADGES.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Image" className="sm:col-span-2">
                  <ImageField name="image" />
                </Field>
              </div>
              <SubmitButton>Add item</SubmitButton>
            </form>
          </Card>

          <p className="text-xs text-faint">{items.length} items in {current.label}</p>
          <div className="space-y-3">
            {items.map((s) => (
              <Card key={s.id} className={s.isActive ? "" : "opacity-60"}>
                <form action={saveService} className="space-y-3">
                  <input type="hidden" name="id" value={s.id} />
                  <div className="grid gap-3 sm:grid-cols-4">
                    <Field label="Title" className="sm:col-span-2">
                      <input name="title" defaultValue={s.title} required className={inputCls} />
                    </Field>
                    <Field label="Section">
                      <input name="subcategory" defaultValue={s.subcategory} className={inputCls} />
                    </Field>
                    <Field label="Badge">
                      <select name="badge" defaultValue={s.badge ?? ""} className={inputCls}>
                        <option value="">None</option>
                        {BADGES.map((b) => (
                          <option key={b}>{b}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Stitching ₹">
                      <input name="stitching" type="number" min={0} defaultValue={s.stitching} className={inputCls} />
                    </Field>
                    <Field label="Fabric from ₹">
                      <input name="fabricFrom" type="number" min={0} defaultValue={s.fabricFrom} className={inputCls} />
                    </Field>
                    <Field label="Order">
                      <input name="sortOrder" type="number" min={0} defaultValue={s.sortOrder} className={inputCls} />
                    </Field>
                    <label className="flex items-end gap-2 pb-2 text-sm">
                      <input type="checkbox" name="isActive" defaultChecked={s.isActive} className="h-4 w-4" />
                      Visible
                    </label>
                    <Field label="Image" className="sm:col-span-4">
                      <ImageField name="image" defaultValue={s.image} compact />
                    </Field>
                  </div>
                  <div className="flex items-center gap-3">
                    <SubmitButton className="btn-outline !py-1.5 !text-[11px]">Save</SubmitButton>
                    <button
                      formAction={deleteService}
                      className="ml-auto text-xs text-faint hover:text-brand"
                    >
                      Delete item
                    </button>
                  </div>
                </form>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

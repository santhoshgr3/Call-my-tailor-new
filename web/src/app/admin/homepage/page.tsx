import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { PageHeader, Card, inputCls, SubmitButton } from "@/components/admin/ui";
import {
  saveSlide,
  deleteSlide,
  saveBanner,
  deleteBanner,
  saveBrand,
  deleteBrand,
  saveLayout,
} from "./actions";

export const dynamic = "force-dynamic";

const SECTION_LABELS: Record<string, string> = {
  show_hero: "Hero slider",
  show_how_it_works: "How it works",
  show_specialization: "Our specialization",
  show_order_by_category: "Order by category",
  show_rails: "Best sellers / New / Rating",
  show_why_choose_us: "Why choose us",
  show_trending: "Trending items",
  show_made_cta: "Made for you CTA",
  show_fabric_brands: "Fabric brands",
  show_testimonials: "Testimonials",
  show_stats: "Stats counter",
  show_latest_blog: "Latest blog",
};

export default async function AdminHomepage() {
  const [slides, banners, brands, layout] = await Promise.all([
    db.heroSlide.findMany({ orderBy: { sortOrder: "asc" } }),
    db.promoBanner.findMany({ orderBy: { sortOrder: "asc" } }),
    db.fabricBrand.findMany({ orderBy: { sortOrder: "asc" } }),
    getSetting<Record<string, boolean>>("home_layout", {}),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title="Homepage" subtitle="Manage hero, banners, brands and section visibility" />

      {/* Section toggles */}
      <Card>
        <h2 className="mb-3 font-bold">Section visibility</h2>
        <form action={saveLayout} className="grid gap-2 sm:grid-cols-3">
          {Object.keys(SECTION_LABELS).map((k) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name={k}
                defaultChecked={layout[k] !== false}
                className="h-4 w-4"
              />
              {SECTION_LABELS[k]}
            </label>
          ))}
          <div className="sm:col-span-3">
            <SubmitButton>Save section visibility</SubmitButton>
          </div>
        </form>
      </Card>

      {/* Hero slides */}
      <section>
        <h2 className="mb-3 text-lg font-bold">Hero Slides</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {slides.map((s) => (
            <Card key={s.id}>
              <form action={saveSlide} className="space-y-2">
                <input type="hidden" name="id" value={s.id} />
                {s.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.imageUrl} alt="" className="h-24 w-full rounded object-cover" />
                )}
                <input name="imageUrl" defaultValue={s.imageUrl} className={inputCls} placeholder="Image URL" />
                <input name="headline" defaultValue={s.headline ?? ""} className={inputCls} placeholder="Headline / alt" />
                <input name="link" defaultValue={s.link ?? ""} className={inputCls} placeholder="Link" />
                <div className="flex items-center gap-3">
                  <input name="sortOrder" type="number" defaultValue={s.sortOrder} className={inputCls + " w-24"} />
                  <label className="flex items-center gap-1 text-sm">
                    <input type="checkbox" name="isActive" defaultChecked={s.isActive} /> Active
                  </label>
                  <SubmitButton className="btn-outline !py-1.5 !text-[11px]">Save</SubmitButton>
                </div>
              </form>
              <form action={deleteSlide} className="mt-1 text-right">
                <input type="hidden" name="id" value={s.id} />
                <button className="text-xs text-faint hover:text-brand">Delete</button>
              </form>
            </Card>
          ))}
          <Card>
            <form action={saveSlide} className="space-y-2">
              <p className="text-sm font-bold">Add slide</p>
              <input name="imageUrl" required className={inputCls} placeholder="Image URL" />
              <input name="headline" className={inputCls} placeholder="Headline / alt" />
              <input name="link" className={inputCls} placeholder="Link" />
              <input name="sortOrder" type="number" defaultValue={slides.length} className={inputCls + " w-24"} />
              <input type="hidden" name="isActive" value="on" />
              <SubmitButton>Add slide</SubmitButton>
            </form>
          </Card>
        </div>
      </section>

      {/* Promo banners */}
      <section>
        <h2 className="mb-3 text-lg font-bold">Promo Banners</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {banners.map((b) => (
            <Card key={b.id}>
              <form action={saveBanner} className="space-y-2">
                <input type="hidden" name="id" value={b.id} />
                {b.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.imageUrl} alt="" className="h-24 w-full rounded object-cover" />
                )}
                <input name="imageUrl" defaultValue={b.imageUrl} className={inputCls} placeholder="Image URL" />
                <input name="title" defaultValue={b.title ?? ""} className={inputCls} placeholder="Title" />
                <input name="subtitle" defaultValue={b.subtitle ?? ""} className={inputCls} placeholder="Subtitle" />
                <div className="grid grid-cols-2 gap-2">
                  <input name="buttonLabel" defaultValue={b.buttonLabel ?? ""} className={inputCls} placeholder="Button label" />
                  <input name="link" defaultValue={b.link ?? ""} className={inputCls} placeholder="Link" />
                </div>
                <div className="flex items-center gap-3">
                  <input name="position" defaultValue={b.position} className={inputCls + " w-28"} />
                  <input name="sortOrder" type="number" defaultValue={b.sortOrder} className={inputCls + " w-20"} />
                  <label className="flex items-center gap-1 text-sm">
                    <input type="checkbox" name="isActive" defaultChecked={b.isActive} /> Active
                  </label>
                  <SubmitButton className="btn-outline !py-1.5 !text-[11px]">Save</SubmitButton>
                </div>
              </form>
              <form action={deleteBanner} className="mt-1 text-right">
                <input type="hidden" name="id" value={b.id} />
                <button className="text-xs text-faint hover:text-brand">Delete</button>
              </form>
            </Card>
          ))}
          <Card>
            <form action={saveBanner} className="space-y-2">
              <p className="text-sm font-bold">Add banner</p>
              <input name="imageUrl" required className={inputCls} placeholder="Image URL" />
              <input name="title" className={inputCls} placeholder="Title" />
              <input name="subtitle" className={inputCls} placeholder="Subtitle" />
              <input name="buttonLabel" className={inputCls} placeholder="Button label" />
              <input name="link" className={inputCls} placeholder="Link" />
              <input type="hidden" name="position" value="home-top" />
              <input name="sortOrder" type="number" defaultValue={banners.length} className={inputCls + " w-20"} />
              <input type="hidden" name="isActive" value="on" />
              <SubmitButton>Add banner</SubmitButton>
            </form>
          </Card>
        </div>
      </section>

      {/* Fabric brands */}
      <section>
        <h2 className="mb-3 text-lg font-bold">Fabric Brands</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((br) => (
            <Card key={br.id}>
              <form action={saveBrand} className="space-y-2">
                <input type="hidden" name="id" value={br.id} />
                {br.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={br.logoUrl} alt="" className="h-12 w-auto object-contain" />
                )}
                <input name="name" defaultValue={br.name} className={inputCls} placeholder="Name" />
                <input name="logoUrl" defaultValue={br.logoUrl} className={inputCls} placeholder="Logo URL" />
                <div className="flex items-center gap-2">
                  <input name="sortOrder" type="number" defaultValue={br.sortOrder} className={inputCls + " w-20"} />
                  <label className="flex items-center gap-1 text-sm">
                    <input type="checkbox" name="isActive" defaultChecked={br.isActive} /> Active
                  </label>
                  <SubmitButton className="btn-outline !py-1.5 !text-[11px]">Save</SubmitButton>
                </div>
              </form>
              <form action={deleteBrand} className="mt-1 text-right">
                <input type="hidden" name="id" value={br.id} />
                <button className="text-xs text-faint hover:text-brand">Delete</button>
              </form>
            </Card>
          ))}
          <Card>
            <form action={saveBrand} className="space-y-2">
              <p className="text-sm font-bold">Add brand</p>
              <input name="name" className={inputCls} placeholder="Name" />
              <input name="logoUrl" required className={inputCls} placeholder="Logo URL" />
              <input name="sortOrder" type="number" defaultValue={brands.length} className={inputCls + " w-20"} />
              <input type="hidden" name="isActive" value="on" />
              <SubmitButton>Add brand</SubmitButton>
            </form>
          </Card>
        </div>
      </section>
    </div>
  );
}

import { db } from "@/lib/db";
import { PageHeader, Card, inputCls, SubmitButton } from "@/components/admin/ui";
import { GalleryAdder } from "@/components/admin/GalleryAdder";
import { saveGalleryItem, deleteGalleryItem } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminGallery() {
  const items = await db.galleryItem.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  const cats = Array.from(new Set(items.map((i) => i.category).filter(Boolean)));
  return (
    <div className="max-w-5xl space-y-5">
      <PageHeader
        title="Gallery"
        subtitle={`${items.length} photos — shown on the public /gallery page (“Our work”)`}
      />
      <Card>
        <h2 className="mb-1 font-bold">Add photos</h2>
        <p className="mb-3 text-xs text-faint">
          Choose a category, then pick as many photos as you like from the Media Library (you can upload new ones
          from the picker). Customers can filter the gallery by category.
        </p>
        <GalleryAdder categories={cats} />
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((g) => (
          <div key={g.id} className={`overflow-hidden rounded-lg border border-line bg-white ${g.isActive ? "" : "opacity-60"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.imageUrl} alt="" className="aspect-[3/4] w-full object-cover" />
            <form action={saveGalleryItem} className="space-y-1.5 p-2 text-xs">
              <input type="hidden" name="id" value={g.id} />
              <input name="category" list="gallery-cats-edit" defaultValue={g.category} placeholder="Category" className={inputCls + " !py-1 !text-xs"} />
              <input name="caption" defaultValue={g.caption ?? ""} placeholder="Caption (optional)" className={inputCls + " !py-1 !text-xs"} />
              <div className="flex items-center gap-2">
                <input name="sortOrder" type="number" defaultValue={g.sortOrder} className={inputCls + " !w-16 !py-1 !text-xs"} />
                <label className="flex items-center gap-1">
                  <input type="checkbox" name="isActive" defaultChecked={g.isActive} /> Show
                </label>
              </div>
              <div className="flex items-center justify-between">
                <SubmitButton className="btn-outline !px-3 !py-1 !text-[10px]">Save</SubmitButton>
                <button formAction={deleteGalleryItem} className="text-faint hover:text-brand">
                  Delete
                </button>
              </div>
            </form>
          </div>
        ))}
      </div>
      <datalist id="gallery-cats-edit">
        {cats.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      {items.length === 0 && <p className="text-sm text-faint">No photos yet — use “Add photos” above.</p>}
    </div>
  );
}

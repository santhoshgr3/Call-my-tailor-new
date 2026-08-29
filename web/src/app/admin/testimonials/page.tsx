import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, Card, Field, inputCls, SubmitButton } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

async function saveTestimonial(fd: FormData) {
  "use server";
  await requireAdmin();
  const id = String(fd.get("id") || "");
  const data = {
    name: String(fd.get("name") || "").trim(),
    role: String(fd.get("role") || "").trim() || null,
    text: String(fd.get("text") || "").trim(),
    imageUrl: String(fd.get("imageUrl") || "").trim() || null,
    rating: Math.min(5, Math.max(1, Math.round(Number(fd.get("rating") || 5)))),
    sortOrder: Math.round(Number(fd.get("sortOrder") || 0)),
    isActive: fd.get("isActive") === "on",
  };
  if (!data.name || !data.text) return;
  if (id) await db.testimonial.update({ where: { id }, data });
  else await db.testimonial.create({ data });
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
}

async function deleteTestimonial(fd: FormData) {
  "use server";
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (id) await db.testimonial.delete({ where: { id } });
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
}

export default async function AdminTestimonials() {
  const items = await db.testimonial.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <PageHeader title="Testimonials" subtitle={`${items.length} testimonials`} />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {items.map((t) => (
            <Card key={t.id}>
              <form action={saveTestimonial} className="space-y-2">
                <input type="hidden" name="id" value={t.id} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <input name="name" defaultValue={t.name} className={inputCls} placeholder="Name" />
                  <input name="role" defaultValue={t.role ?? ""} className={inputCls} placeholder="Role" />
                </div>
                <textarea name="text" defaultValue={t.text} rows={3} className={inputCls} />
                <div className="grid gap-2 sm:grid-cols-3">
                  <input name="imageUrl" defaultValue={t.imageUrl ?? ""} className={inputCls} placeholder="Image URL" />
                  <input name="rating" type="number" min={1} max={5} defaultValue={t.rating} className={inputCls} />
                  <input name="sortOrder" type="number" defaultValue={t.sortOrder} className={inputCls} />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="isActive" defaultChecked={t.isActive} className="h-4 w-4" />
                    Active
                  </label>
                  <div className="flex gap-2">
                    <SubmitButton className="btn-outline !py-1.5 !text-[11px]">Save</SubmitButton>
                  </div>
                </div>
              </form>
              <form action={deleteTestimonial} className="mt-1 text-right">
                <input type="hidden" name="id" value={t.id} />
                <button className="text-xs text-faint hover:text-brand">Delete</button>
              </form>
            </Card>
          ))}
        </div>

        <Card className="h-fit">
          <h2 className="mb-3 font-bold">Add testimonial</h2>
          <form action={saveTestimonial} className="space-y-3">
            <Field label="Name">
              <input name="name" required className={inputCls} />
            </Field>
            <Field label="Role">
              <input name="role" className={inputCls} />
            </Field>
            <Field label="Text">
              <textarea name="text" required rows={4} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Rating">
                <input name="rating" type="number" min={1} max={5} defaultValue={5} className={inputCls} />
              </Field>
              <Field label="Sort order">
                <input name="sortOrder" type="number" defaultValue={items.length} className={inputCls} />
              </Field>
            </div>
            <Field label="Image URL">
              <input name="imageUrl" className={inputCls} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4" />
              Active
            </label>
            <SubmitButton>Add testimonial</SubmitButton>
          </form>
        </Card>
      </div>
    </div>
  );
}

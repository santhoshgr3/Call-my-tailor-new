import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { bustStorefrontCache } from "@/lib/cache";
import { getSetting, setSetting } from "@/lib/settings";
import { PageHeader, Card, Field, inputCls, SubmitButton } from "@/components/admin/ui";
import { ImageField } from "@/components/admin/ImageField";
import { GOOGLE_REVIEWS_KEY, isGoogleLink } from "@/lib/testimonials";

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
    videoUrl: String(fd.get("videoUrl") || "").trim() || null,
    // stored in the existing fbUrl column; shown as the Google icon link on the Testimonials page
    fbUrl: String(fd.get("reviewUrl") || "").trim() || null,
    rating: Math.min(5, Math.max(1, Math.round(Number(fd.get("rating") || 5)))),
    sortOrder: Math.round(Number(fd.get("sortOrder") || 0)),
    isActive: fd.get("isActive") === "on",
  };
  if (!data.name || (!data.text && !data.videoUrl && !data.imageUrl)) return;
  if (id) await db.testimonial.update({ where: { id }, data });
  else await db.testimonial.create({ data });
  bustStorefrontCache();
  revalidatePath("/admin/testimonials");
  revalidatePath("/testimonials");
  revalidatePath("/");
}

async function deleteTestimonial(fd: FormData) {
  "use server";
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (id) await db.testimonial.delete({ where: { id } });
  bustStorefrontCache();
  revalidatePath("/admin/testimonials");
  revalidatePath("/testimonials");
  revalidatePath("/");
}

async function saveGoogleLink(fd: FormData) {
  "use server";
  await requireAdmin();
  await setSetting(GOOGLE_REVIEWS_KEY, String(fd.get("url") || "").trim());
  revalidatePath("/admin/testimonials");
  revalidatePath("/testimonials");
}

export default async function AdminTestimonials() {
  const [items, googleUrl] = await Promise.all([
    db.testimonial.findMany({ orderBy: { sortOrder: "asc" } }),
    getSetting<string>(GOOGLE_REVIEWS_KEY, ""),
  ]);
  const videoCount = items.filter((t) => t.videoUrl).length;

  return (
    <div>
      <PageHeader
        title="Testimonials"
        subtitle={`${items.length} testimonials · ${videoCount} with video`}
      />
      <p className="mb-4 rounded border border-line bg-soft p-3 text-xs text-faint">
        These appear on the <b>Testimonials</b> page. Each one can show a <b>video</b> (YouTube link) or a{" "}
        <b>photo</b> next to the review, with a Google icon linking to the review. Testimonials with a video
        also appear in the homepage video carousel.
      </p>

      <Card className="mb-6">
        <form action={saveGoogleLink} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[260px] flex-1">
            <Field
              label="Google reviews link"
              hint="Your Google Business reviews page. Used for the Google icon when a testimonial has no link of its own."
            >
              <input
                name="url"
                defaultValue={googleUrl}
                className={inputCls}
                placeholder="https://g.page/r/…/review"
              />
            </Field>
          </div>
          <SubmitButton className="btn-outline !py-2 !text-[11px]">Save link</SubmitButton>
        </form>
      </Card>

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
                <textarea name="text" defaultValue={t.text} rows={2} className={inputCls} placeholder="Review text" />
                <input
                  name="videoUrl"
                  defaultValue={t.videoUrl ?? ""}
                  className={inputCls}
                  placeholder="Video: YouTube URL or video ID (optional)"
                />
                <input
                  name="reviewUrl"
                  defaultValue={isGoogleLink(t.fbUrl) ? t.fbUrl ?? "" : ""}
                  className={inputCls}
                  placeholder="Google review link for this person (optional)"
                />
                <div className="grid gap-2 sm:grid-cols-3">
                  <ImageField name="imageUrl" defaultValue={t.imageUrl ?? ""} placeholder="Photo (optional)" compact />
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
            <Field label="Review text">
              <textarea name="text" rows={3} className={inputCls} />
            </Field>
            <Field label="Video URL" hint="YouTube link or video ID — shown instead of the photo">
              <input name="videoUrl" className={inputCls} placeholder="https://youtu.be/xxxxxxxxxxx" />
            </Field>
            <Field label="Photo">
              <ImageField name="imageUrl" />
            </Field>
            <Field label="Google review link" hint="Optional — otherwise the general Google reviews link is used">
              <input name="reviewUrl" className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Rating">
                <input name="rating" type="number" min={1} max={5} defaultValue={5} className={inputCls} />
              </Field>
              <Field label="Sort order">
                <input name="sortOrder" type="number" defaultValue={items.length} className={inputCls} />
              </Field>
            </div>
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

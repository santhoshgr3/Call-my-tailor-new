import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, Field, inputCls, SubmitButton } from "@/components/admin/ui";

async function savePage(fd: FormData) {
  "use server";
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (!id) return;
  await db.infoPage.update({
    where: { id },
    data: {
      title: String(fd.get("title") || "").trim(),
      contentHtml: String(fd.get("contentHtml") || ""),
      metaTitle: String(fd.get("metaTitle") || "").trim() || null,
      metaDescription: String(fd.get("metaDescription") || "").trim() || null,
      isPublished: fd.get("isPublished") === "on",
    },
  });
  revalidatePath("/admin/pages");
  redirect("/admin/pages");
}

async function deletePage(fd: FormData) {
  "use server";
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (id) await db.infoPage.delete({ where: { id } });
  revalidatePath("/admin/pages");
  redirect("/admin/pages");
}

export default async function EditInfoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = await db.infoPage.findUnique({ where: { id } });
  if (!page) notFound();
  return (
    <div className="max-w-3xl">
      <PageHeader title="Edit page" subtitle={`/${page.slug}`} />
      <form action={savePage} className="space-y-4 rounded-lg border border-line bg-white p-5">
        <input type="hidden" name="id" value={page.id} />
        <Field label="Title"><input name="title" defaultValue={page.title} className={inputCls} required /></Field>
        <Field label="Content (HTML)">
          <textarea name="contentHtml" defaultValue={page.contentHtml} rows={20} className={inputCls + " font-mono text-xs"} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Meta title"><input name="metaTitle" defaultValue={page.metaTitle ?? ""} className={inputCls} /></Field>
          <Field label="Meta description"><input name="metaDescription" defaultValue={page.metaDescription ?? ""} className={inputCls} /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isPublished" defaultChecked={page.isPublished} className="h-4 w-4" />
          Published
        </label>
        <div className="flex gap-3">
          <SubmitButton>Save changes</SubmitButton>
          <Link href="/admin/pages" className="btn-outline !py-2 !text-[11px]">Cancel</Link>
        </div>
      </form>
      <form action={deletePage} className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
        <input type="hidden" name="id" value={page.id} />
        <button className="rounded border border-red-300 bg-white px-3 py-1.5 text-xs font-bold uppercase text-red-700">Delete page</button>
      </form>
    </div>
  );
}

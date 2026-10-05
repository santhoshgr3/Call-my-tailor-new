import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { bustStorefrontCache } from "@/lib/cache";
import { PageHeader, Card, inputCls, SubmitButton } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

async function saveVlog(fd: FormData) {
  "use server";
  await requireAdmin();
  const id = String(fd.get("id") || "");
  const data = {
    title: String(fd.get("title") || "").trim().slice(0, 150),
    videoUrl: String(fd.get("videoUrl") || "").trim().slice(0, 300),
    sortOrder: Math.round(Number(fd.get("sortOrder") || 0)) || 0,
    isActive: fd.get("isActive") === "on",
  };
  if (!data.title || !/(youtu\.be\/|youtube\.com\/|^[a-zA-Z0-9_-]{11}$)/.test(data.videoUrl)) return;
  if (id) await db.vlog.update({ where: { id }, data }).catch(() => null);
  else await db.vlog.create({ data: { ...data, isActive: true } });
  bustStorefrontCache();
  revalidatePath("/admin/vlogs");
  revalidatePath("/");
}

async function deleteVlog(fd: FormData) {
  "use server";
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (id) await db.vlog.delete({ where: { id } }).catch(() => null);
  bustStorefrontCache();
  revalidatePath("/admin/vlogs");
  revalidatePath("/");
}

export default async function AdminVlogs() {
  const items = await db.vlog.findMany({ orderBy: [{ sortOrder: "asc" }, { title: "asc" }] });
  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader title="Vlogs" subtitle="YouTube videos shown in the Vlogs section on the homepage" />
      <Card>
        <form action={saveVlog} className="space-y-3">
          <h2 className="font-bold">Add a vlog</h2>
          <input name="title" required placeholder="Title" className={inputCls} />
          <input
            name="videoUrl"
            required
            placeholder="YouTube link, e.g. https://youtu.be/xxxxxxxxxxx"
            className={inputCls}
          />
          <SubmitButton>Add vlog</SubmitButton>
        </form>
      </Card>
      {items.map((v) => (
        <Card key={v.id} className={v.isActive ? "" : "opacity-60"}>
          <form action={saveVlog} className="space-y-2">
            <input type="hidden" name="id" value={v.id} />
            <input name="title" defaultValue={v.title} className={inputCls} />
            <input name="videoUrl" defaultValue={v.videoUrl} className={inputCls} />
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="flex items-center gap-2">
                Order
                <input name="sortOrder" type="number" defaultValue={v.sortOrder} className={inputCls + " w-20"} />
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="isActive" defaultChecked={v.isActive} className="h-4 w-4" />
                Visible
              </label>
              <SubmitButton className="btn-outline !py-1.5 !text-[11px]">Save</SubmitButton>
              <button formAction={deleteVlog} className="ml-auto text-xs text-faint hover:text-brand">
                Delete vlog
              </button>
            </div>
          </form>
        </Card>
      ))}
      {items.length === 0 && <p className="text-sm text-faint">No vlogs yet — add your first YouTube link above.</p>}
    </div>
  );
}

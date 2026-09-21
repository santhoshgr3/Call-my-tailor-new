import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, Card } from "@/components/admin/ui";
import { MediaUploader } from "@/components/admin/MediaUploader";

export const dynamic = "force-dynamic";

async function deleteMedia(fd: FormData) {
  "use server";
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (id) await db.media.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/media");
}

export default async function AdminMedia() {
  const items = await db.media.findMany({
    where: { source: "admin" },
    orderBy: { createdAt: "desc" },
    take: 300,
    select: { id: true, filename: true, size: true, createdAt: true },
  });
  const total = items.reduce((n, m) => n + m.size, 0);

  return (
    <div>
      <PageHeader
        title="Media library"
        subtitle={`${items.length} image${items.length === 1 ? "" : "s"} · ${(total / 1024 / 1024).toFixed(1)} MB`}
      />
      <Card className="mb-6">
        <MediaUploader />
      </Card>

      {items.length === 0 ? (
        <p className="text-sm text-faint">No uploads yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {items.map((m) => (
            <div key={m.id} className="overflow-hidden rounded-lg border border-line bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/media/${m.id}`} alt={m.filename} className="aspect-square w-full bg-soft object-cover" />
              <div className="space-y-1 p-2 text-[11px]">
                <p className="truncate font-semibold" title={m.filename}>
                  {m.filename}
                </p>
                <p className="truncate text-faint">/media/{m.id}</p>
                <form action={deleteMedia}>
                  <input type="hidden" name="id" value={m.id} />
                  <button className="text-faint hover:text-brand">Delete</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-6 text-xs text-faint">
        Deleting an image that is still used somewhere will leave a broken image there — replace it
        first.
      </p>
    </div>
  );
}

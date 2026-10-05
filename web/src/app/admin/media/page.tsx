import Link from "next/link";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getSetting, setSetting } from "@/lib/settings";
import { bustStorefrontCache } from "@/lib/cache";
import { PageHeader, Card, inputCls } from "@/components/admin/ui";
import { MediaUploader } from "@/components/admin/MediaUploader";

export const dynamic = "force-dynamic";

const cleanFolder = (v: FormDataEntryValue | null) =>
  String(v ?? "")
    .replace(/[<>"'`]/g, "")
    .trim()
    .slice(0, 40);

async function deleteMedia(fd: FormData) {
  "use server";
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (id) await db.media.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/media");
}

async function createFolder(fd: FormData) {
  "use server";
  await requireAdmin();
  const name = cleanFolder(fd.get("name"));
  if (!name) return;
  const saved = await getSetting<string[]>("media_folders", []);
  if (!saved.includes(name)) await setSetting("media_folders", [...saved, name]);
  bustStorefrontCache();
  revalidatePath("/admin/media");
}

async function moveMedia(fd: FormData) {
  "use server";
  await requireAdmin();
  const id = String(fd.get("id") || "");
  const folder = cleanFolder(fd.get("folder"));
  if (!id) return;
  await db.media.update({ where: { id }, data: { folder } }).catch(() => null);
  if (folder) {
    const saved = await getSetting<string[]>("media_folders", []);
    if (!saved.includes(folder)) await setSetting("media_folders", [...saved, folder]);
    bustStorefrontCache();
  }
  revalidatePath("/admin/media");
}

async function deleteFolder(fd: FormData) {
  "use server";
  await requireAdmin();
  const name = cleanFolder(fd.get("name"));
  if (!name) return;
  // images are kept — they just move back to "No folder"
  await db.media.updateMany({ where: { folder: name }, data: { folder: "" } });
  const saved = await getSetting<string[]>("media_folders", []);
  await setSetting("media_folders", saved.filter((f) => f !== name));
  bustStorefrontCache();
  revalidatePath("/admin/media");
}

export default async function AdminMedia({ searchParams }: { searchParams: Promise<{ folder?: string }> }) {
  const sp = await searchParams;
  const current = sp.folder; // undefined = all, "" = no folder, else folder name
  const [items, groups, saved] = await Promise.all([
    db.media.findMany({
      where: { source: "admin", ...(current !== undefined ? { folder: current } : {}) },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: { id: true, filename: true, size: true, folder: true },
    }),
    db.media.groupBy({ by: ["folder"], where: { source: "admin" }, _count: true }),
    getSetting<string[]>("media_folders", []),
  ]);
  const counts = new Map(groups.map((g) => [g.folder, g._count]));
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  const folders = Array.from(new Set([...saved, ...groups.map((g) => g.folder).filter(Boolean)])).sort();
  const bytes = items.reduce((n, m) => n + m.size, 0);

  const chip = (href: string, label: string, active: boolean) => (
    <Link
      key={href}
      href={href}
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
        active ? "border-brand bg-brand text-white" : "border-line bg-white text-muted hover:border-brand"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div>
      <PageHeader
        title="Media library"
        subtitle={`${items.length} image${items.length === 1 ? "" : "s"} shown · ${(bytes / 1024 / 1024).toFixed(1)} MB`}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {chip("/admin/media", `All (${total})`, current === undefined)}
        {folders.map((f) =>
          chip(`/admin/media?folder=${encodeURIComponent(f)}`, `📁 ${f} (${counts.get(f) ?? 0})`, current === f),
        )}
        {chip("/admin/media?folder=", `No folder (${counts.get("") ?? 0})`, current === "")}
        <form action={createFolder} className="ml-auto flex gap-2">
          <input name="name" placeholder="New folder name" maxLength={40} className={inputCls + " !w-44 !py-1.5"} />
          <button className="btn-outline !py-1.5 !text-[11px]">+ Create folder</button>
        </form>
      </div>

      {current && (
        <form action={deleteFolder} className="mb-3 text-xs text-faint">
          <input type="hidden" name="name" value={current} />
          Folder “{current}” —{" "}
          <button className="font-semibold text-brand hover:underline">Delete folder (images are kept)</button>
        </form>
      )}

      <Card className="mb-6">
        <MediaUploader folder={current ?? ""} />
      </Card>

      {items.length === 0 ? (
        <p className="text-sm text-faint">No images here yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {items.map((m) => (
            <div key={m.id} className="overflow-hidden rounded-lg border border-line bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/media/${m.id}`} alt={m.filename} className="aspect-square w-full bg-soft object-cover" />
              <div className="space-y-1.5 p-2 text-[11px]">
                <p className="truncate font-semibold" title={m.filename}>
                  {m.filename}
                </p>
                <p className="truncate text-faint">/media/{m.id}</p>
                <form action={moveMedia} className="flex gap-1">
                  <input type="hidden" name="id" value={m.id} />
                  <input
                    name="folder"
                    list="media-folders"
                    defaultValue={m.folder}
                    placeholder="Folder…"
                    className="min-w-0 flex-1 rounded border border-line px-1.5 py-1 text-[11px] outline-none focus:border-brand"
                  />
                  <button className="rounded border border-line px-1.5 hover:border-brand hover:text-brand">Move</button>
                </form>
                <form action={deleteMedia}>
                  <input type="hidden" name="id" value={m.id} />
                  <button className="text-faint hover:text-brand">Delete</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
      <datalist id="media-folders">
        {folders.map((f) => (
          <option key={f} value={f} />
        ))}
      </datalist>
      <p className="mt-6 text-xs text-faint">
        Deleting an image that is still used somewhere will leave a broken image there — replace it
        first.
      </p>
    </div>
  );
}

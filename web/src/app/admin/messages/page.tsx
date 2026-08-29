import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, StatusPill } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

async function toggleRead(fd: FormData) {
  "use server";
  await requireAdmin();
  const id = String(fd.get("id") || "");
  const m = await db.contactMessage.findUnique({ where: { id } });
  if (m)
    await db.contactMessage.update({
      where: { id },
      data: { status: m.status === "new" ? "read" : "new" },
    });
  revalidatePath("/admin/messages");
}

async function del(fd: FormData) {
  "use server";
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (id) await db.contactMessage.delete({ where: { id } });
  revalidatePath("/admin/messages");
}

export default async function AdminMessages() {
  const msgs = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <PageHeader title="Contact Messages" subtitle={`${msgs.length} messages`} />
      <div className="space-y-3">
        {msgs.length === 0 && (
          <p className="rounded-lg border border-line bg-white p-8 text-center text-sm text-faint">
            No messages.
          </p>
        )}
        {msgs.map((m) => (
          <div
            key={m.id}
            className={`rounded-lg border p-4 ${
              m.status === "new" ? "border-brand/40 bg-brand/5" : "border-line bg-white"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-bold">
                  {m.name}{" "}
                  <span className="font-normal text-faint">
                    · {m.email}
                    {m.phone ? ` · ${m.phone}` : ""}
                  </span>
                </p>
                {m.subject && <p className="text-sm font-semibold">{m.subject}</p>}
                <p className="mt-1 text-sm text-muted">{m.message}</p>
                <p className="mt-1 text-[11px] text-faint">
                  {new Date(m.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill value={m.status} />
                <form action={toggleRead}>
                  <input type="hidden" name="id" value={m.id} />
                  <button className="btn-outline !py-1.5 !text-[11px]">
                    {m.status === "new" ? "Mark read" : "Mark unread"}
                  </button>
                </form>
                <form action={del}>
                  <input type="hidden" name="id" value={m.id} />
                  <button className="text-xs text-faint hover:text-brand">Delete</button>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

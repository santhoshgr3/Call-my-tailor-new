import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, StatusPill, inputCls } from "@/components/admin/ui";
import { BOOKING_STATUSES } from "@/lib/constants";

export const dynamic = "force-dynamic";

async function setBookingStatus(fd: FormData) {
  "use server";
  await requireAdmin();
  const id = String(fd.get("id") || "");
  const status = String(fd.get("status") || "");
  if (id && (BOOKING_STATUSES as readonly string[]).includes(status)) {
    await db.homeVisitBooking.update({ where: { id }, data: { status } });
    revalidatePath("/admin/bookings");
  }
}

export default async function AdminBookings({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const bookings = await db.homeVisitBooking.findMany({
    where: sp.status ? { status: sp.status } : {},
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Home Visit Requests" subtitle={`${bookings.length} requests`} />
      <div className="space-y-3">
        {bookings.length === 0 && (
          <p className="rounded-lg border border-line bg-white p-8 text-center text-sm text-faint">
            No home visit requests yet.
          </p>
        )}
        {bookings.map((b) => (
          <div key={b.id} className="rounded-lg border border-line bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold">
                  {b.name} <span className="font-normal text-faint">· {b.phone}</span>
                </p>
                <p className="text-sm text-muted">{b.email}</p>
                <p className="mt-1 text-sm">
                  {b.address}
                  {b.city ? `, ${b.city}` : ""} {b.pincode}
                </p>
                <p className="mt-1 text-xs text-faint">
                  {b.category && <>Interested in: {b.category} · </>}
                  {b.preferredDate && <>Date: {b.preferredDate} </>}
                  {b.preferredTime && <>· {b.preferredTime}</>}
                </p>
                {b.message && <p className="mt-1 text-sm italic text-muted">“{b.message}”</p>}
                <p className="mt-1 text-[11px] text-faint">
                  {new Date(b.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              <form action={setBookingStatus} className="flex items-center gap-2">
                <input type="hidden" name="id" value={b.id} />
                <StatusPill value={b.status} />
                <select name="status" defaultValue={b.status} className={inputCls + " w-auto"}>
                  {BOOKING_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button className="btn-outline !py-1.5 !text-[11px]">Update</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

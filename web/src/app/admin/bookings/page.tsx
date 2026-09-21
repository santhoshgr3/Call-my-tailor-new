import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader, StatusPill, inputCls } from "@/components/admin/ui";
import { BookingTabs } from "@/components/admin/BookingTabs";
import { BOOKING_STATUSES } from "@/lib/constants";
import {
  BOOKING_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_LIST,
} from "@/lib/booking";
import { formatINRShort } from "@/lib/money";
import { updateBooking, deleteBooking } from "./actions";

export const dynamic = "force-dynamic";

type DesignFile = { name: string; url: string; type: string };

function parseFiles(raw: string | null): DesignFile[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((f) => f && typeof f.url === "string") : [];
  } catch {
    return [];
  }
}

export default async function AdminBookings({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const [bookings, counts] = await Promise.all([
    db.homeVisitBooking.findMany({
      where: {
        ...(sp.status ? { status: sp.status } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { phone: { contains: q } },
                { email: { contains: q, mode: "insensitive" } },
                { city: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { items: true },
    }),
    db.homeVisitBooking.groupBy({ by: ["status"], _count: true }),
  ]);
  const total = counts.reduce((n, c) => n + c._count, 0);
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  const chip = (href: string, label: string, active: boolean) => (
    <Link
      key={label}
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
      <PageHeader title="Home Visit Bookings" subtitle={`${total} bookings in total`} />
      <BookingTabs />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {chip("/admin/bookings", `All (${total})`, !sp.status)}
        {BOOKING_STATUSES.map((s) =>
          chip(`/admin/bookings?status=${s}`, `${BOOKING_STATUS_LABEL[s]} (${countOf(s)})`, sp.status === s),
        )}
        <form action="/admin/bookings" className="ml-auto flex gap-2">
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, phone, city…"
            className="w-56 rounded border border-line px-3 py-1.5 text-sm"
          />
          <button className="btn-outline !py-1.5 !text-[11px]">Search</button>
        </form>
      </div>

      <div className="space-y-3">
        {bookings.length === 0 && (
          <p className="rounded-lg border border-line bg-white p-8 text-center text-sm text-faint">
            No bookings found.
          </p>
        )}
        {bookings.map((b) => {
          const files = parseFiles(b.designFiles);
          return (
            <div key={b.id} className="rounded-lg border border-line bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-bold">
                    {b.name}{" "}
                    <a href={`tel:${b.phone}`} className="font-normal text-brand hover:underline">
                      · {b.phone}
                    </a>
                  </p>
                  <p className="text-sm text-muted">{b.email}</p>
                  <p className="mt-1 text-sm">
                    {b.address}
                    {b.city ? `, ${b.city}` : ""} {b.pincode}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#1a2744]">
                    📅 {b.preferredDate || "—"} {b.preferredTime ? `· ${b.preferredTime}` : ""}
                  </p>
                  {b.location && (
                    <a href={b.location} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-semibold text-green-700 hover:underline">
                      📍 Open location on map ↗
                    </a>
                  )}
                  {b.message && <p className="mt-1 text-sm italic text-muted">“{b.message}”</p>}

                  {b.items.length > 0 && (
                    <div className="mt-3 rounded border border-line bg-soft p-3">
                      <p className="mb-1 text-[11px] font-bold uppercase text-faint">Selected items</p>
                      <ul className="space-y-1 text-sm">
                        {b.items.map((it) => (
                          <li key={it.id} className="flex flex-wrap items-center justify-between gap-2">
                            <span>
                              {it.title} × {it.qty}
                              <span className="ml-2 text-xs text-faint">
                                ({it.category}) · fabric: {it.hasFabric === "yes" ? "customer has" : "needed"}
                              </span>
                            </span>
                            <span className="font-semibold">{formatINRShort(it.price * it.qty)}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 border-t border-line pt-2 text-right text-sm font-bold">
                        Stitching estimate: {formatINRShort(b.totalPrice)}
                      </p>
                    </div>
                  )}

                  {files.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-1 text-[11px] font-bold uppercase text-faint">Design files</p>
                      <div className="flex flex-wrap gap-2">
                        {files.map((f, i) => (
                          <a
                            key={i}
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded border border-line bg-white px-2 py-1 text-xs hover:border-brand"
                          >
                            {f.type?.startsWith("image/") ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={f.url} alt="" className="h-8 w-8 rounded object-cover" />
                            ) : (
                              <span>📄</span>
                            )}
                            <span className="max-w-[140px] truncate">{f.name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="mt-2 text-[11px] text-faint">{new Date(b.createdAt).toLocaleString("en-IN")}</p>
                </div>

                <div className="w-full space-y-2 sm:w-64">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill value={b.status} />
                    <StatusPill value={b.paymentStatus} />
                    {b.visitCharge > 0 && (
                      <span className="text-xs text-faint">visit fee {formatINRShort(b.visitCharge)}</span>
                    )}
                  </div>
                  <form action={updateBooking} className="space-y-2">
                    <input type="hidden" name="id" value={b.id} />
                    <label className="block text-[11px] font-bold uppercase text-faint">
                      Status
                      <select name="status" defaultValue={b.status} className={inputCls + " mt-1"}>
                        {!(BOOKING_STATUSES as readonly string[]).includes(b.status) && (
                          <option value={b.status}>{BOOKING_STATUS_LABEL[b.status] ?? b.status}</option>
                        )}
                        {BOOKING_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {BOOKING_STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-[11px] font-bold uppercase text-faint">
                      Payment
                      <select name="paymentStatus" defaultValue={b.paymentStatus} className={inputCls + " mt-1"}>
                        {PAYMENT_STATUS_LIST.map((s) => (
                          <option key={s} value={s}>
                            {PAYMENT_STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button className="btn-outline w-full !py-1.5 !text-[11px]">Update</button>
                  </form>
                  <form action={deleteBooking}>
                    <input type="hidden" name="id" value={b.id} />
                    <button className="text-xs text-faint hover:text-brand">Delete booking</button>
                  </form>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

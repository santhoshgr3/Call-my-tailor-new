"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { BOOKING_STATUSES } from "@/lib/constants";
import { PAYMENT_STATUS_LIST } from "@/lib/booking";

export async function updateBooking(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") || "");
  const status = String(fd.get("status") || "");
  const paymentStatus = String(fd.get("paymentStatus") || "");
  if (!id) return;
  const data: Record<string, string> = {};
  if ((BOOKING_STATUSES as readonly string[]).includes(status)) data.status = status;
  if ((PAYMENT_STATUS_LIST as readonly string[]).includes(paymentStatus)) data.paymentStatus = paymentStatus;
  if (Object.keys(data).length) await db.homeVisitBooking.update({ where: { id }, data });
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
}

export async function deleteBooking(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (id) await db.homeVisitBooking.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
}

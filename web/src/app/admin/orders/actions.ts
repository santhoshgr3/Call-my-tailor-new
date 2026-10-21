"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { notifyOrderStatus } from "@/lib/whatsapp-notify";

const ORDER_STATUS = [
  "pending",
  "confirmed",
  "in_production",
  "ready",
  "shipped",
  "delivered",
  "cancelled",
];
const PAY_STATUS = ["unpaid", "paid", "refunded"];

export async function updateOrder(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (!id) return;
  const status = String(fd.get("status") || "");
  const paymentStatus = String(fd.get("paymentStatus") || "");
  const notes = String(fd.get("notes") || "");
  const before = await db.order.findUnique({ where: { id }, select: { status: true } });
  await db.order.update({
    where: { id },
    data: {
      status: ORDER_STATUS.includes(status) ? status : undefined,
      paymentStatus: PAY_STATUS.includes(paymentStatus) ? paymentStatus : undefined,
      notes: notes || null,
    },
  });
  if (ORDER_STATUS.includes(status) && before && before.status !== status) {
    await notifyOrderStatus(id, status);
  }
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
}

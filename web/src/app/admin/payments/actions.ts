"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { patchSite, str } from "@/lib/site-admin";

export async function savePayments(fd: FormData) {
  await requireAdmin();

  const keyId = str(fd, "key_id");
  const secretIn = String(fd.get("key_secret") ?? "").trim();

  // Keep the existing secret when the field is left blank.
  const row = await db.setting.findUnique({ where: { key: "razorpay" } });
  let existing: { key_id?: string; key_secret?: string } = {};
  try {
    existing = row ? JSON.parse(row.value) : {};
  } catch {
    existing = {};
  }
  const keySecret = secretIn || existing.key_secret || "";

  if (keyId && keySecret) {
    const value = JSON.stringify({ key_id: keyId, key_secret: keySecret });
    await db.setting.upsert({
      where: { key: "razorpay" },
      create: { key: "razorpay", value },
      update: { value },
    });
  }

  await patchSite({
    payments: {
      cod_enabled: fd.get("cod_enabled") === "on",
      online_enabled: fd.get("online_enabled") === "on",
    },
  });
  revalidatePath("/admin/payments");
}

export async function removeSavedRazorpayKeys() {
  await requireAdmin();
  await db.setting.delete({ where: { key: "razorpay" } }).catch(() => null);
  revalidatePath("/admin/payments");
}

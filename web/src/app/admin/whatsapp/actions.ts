"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { str } from "@/lib/site-admin";
import {
  getInteraktConfig,
  sendInteraktTemplate,
  STATUS_LABELS,
  type InteraktConfig,
} from "@/lib/whatsapp-notify";

export async function saveWhatsapp(fd: FormData) {
  await requireAdmin();
  const prev = await getInteraktConfig();
  const keyIn = String(fd.get("api_key") ?? "").trim();
  const cfg: InteraktConfig = {
    enabled: fd.get("enabled") === "on",
    api_key: keyIn || prev.api_key,
    country_code: str(fd, "country_code").replace(/\D/g, "") || "91",
    order_template: str(fd, "order_template"),
    order_lang: str(fd, "order_lang") || "en",
    status_template: str(fd, "status_template"),
    status_lang: str(fd, "status_lang") || "en",
    admin_phone: str(fd, "admin_phone"),
    status_events: Object.keys(STATUS_LABELS).filter((s) => fd.get(`ev_${s}`) === "on"),
  };
  const value = JSON.stringify(cfg);
  await db.setting.upsert({ where: { key: "interakt" }, create: { key: "interakt", value }, update: { value } });
  revalidatePath("/admin/whatsapp");
}

export async function sendTestWhatsapp(fd: FormData): Promise<void> {
  await requireAdmin();
  const cfg = await getInteraktConfig();
  const r = await sendInteraktTemplate(cfg, str(fd, "test_phone"), cfg.order_template, cfg.order_lang, [
    "Test Customer",
    "CMT-TEST",
    "Sample Suit x1 (Ready to Ship)",
    "₹8,500",
    "₹8,500",
    "Nil",
    "-",
    "Sample address, Delhi - 110001",
  ]);
  const value = JSON.stringify({ ok: r.ok, error: r.error ?? "", at: new Date().toISOString() });
  await db.setting.upsert({
    where: { key: "interakt_last_test" },
    create: { key: "interakt_last_test", value },
    update: { value },
  });
  revalidatePath("/admin/whatsapp");
}

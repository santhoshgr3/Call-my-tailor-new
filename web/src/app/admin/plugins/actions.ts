"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { setSetting } from "@/lib/settings";
import { bustStorefrontCache } from "@/lib/cache";
import { getPluginDef, type PluginState, type PluginValue } from "@/lib/plugin-defs";

async function readState(): Promise<PluginState> {
  try {
    const row = await db.setting.findUnique({ where: { key: "plugins" } });
    return row ? (JSON.parse(row.value) as PluginState) : {};
  } catch {
    return {};
  }
}

async function commit(state: PluginState) {
  await setSetting("plugins", state);
  bustStorefrontCache();
  revalidatePath("/admin/plugins");
  revalidatePath("/", "layout");
}

export async function setPluginEnabled(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (!getPluginDef(id)) return;
  const state = await readState();
  state[id] = { ...state[id], enabled: fd.get("enabled") === "1" };
  await commit(state);
}

export async function savePlugin(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") || "");
  const def = getPluginDef(id);
  if (!def) return;

  const config: Record<string, PluginValue> = {};
  for (const f of def.fields) {
    const raw = fd.get(f.key);
    if (f.type === "toggle") {
      config[f.key] = raw === "on";
    } else if (f.type === "number") {
      const n = Number(raw);
      config[f.key] = Number.isFinite(n) ? Math.max(0, n) : Number(f.default ?? 0);
    } else if (f.type === "color") {
      const s = String(raw ?? "").trim();
      config[f.key] = /^#[0-9a-fA-F]{3,8}$/.test(s) ? s : String(f.default ?? "#000000");
    } else if (f.type === "select") {
      const s = String(raw ?? "");
      config[f.key] = f.options?.some((o) => o.value === s) ? s : String(f.default ?? "");
    } else {
      config[f.key] = String(raw ?? "").slice(0, f.type === "code" ? 20000 : 1000).trim();
    }
  }

  const state = await readState();
  state[id] = { enabled: fd.get("enabled") === "on", config };
  await commit(state);
  revalidatePath(`/admin/plugins/${id}`);
}

export async function resetPlugin(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (!getPluginDef(id)) return;
  const state = await readState();
  delete state[id];
  await commit(state);
  revalidatePath(`/admin/plugins/${id}`);
}

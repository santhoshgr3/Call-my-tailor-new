import { getSetting } from "./settings";
import { resolveAll, type PluginState } from "./plugin-defs";

/** Resolved plugin settings (defaults merged in). Cached with the other site settings. */
export async function getPlugins() {
  const state = await getSetting<PluginState>("plugins", {});
  return resolveAll(state);
}

/** Only allow safe link targets in admin-supplied URLs. */
export function safeHref(v: unknown): string {
  const s = String(v ?? "").trim();
  if (!s) return "";
  if (s.startsWith("/") || s.startsWith("#")) return s;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(s)) return s;
  return "";
}

export function safeColor(v: unknown, fallback: string): string {
  const s = String(v ?? "").trim();
  return /^#[0-9a-fA-F]{3,8}$/.test(s) ? s : fallback;
}

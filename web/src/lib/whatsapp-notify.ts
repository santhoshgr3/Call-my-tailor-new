import "server-only";
import { db } from "./db";
import { getSiteConfig, DEFAULT_HOME_VISIT } from "./settings";
import { isHomeVisitLine } from "./payment-rules";
import { formatINRShort } from "./money";

/** Settings saved from Admin → WhatsApp (Setting row "interakt"). The API key stays on the server. */
export type InteraktConfig = {
  enabled: boolean;
  api_key: string;
  country_code: string; // digits, e.g. "91"
  order_template: string;
  order_lang: string;
  status_template: string;
  status_lang: string;
  admin_phone: string;
  status_events: string[];
};

export const DEFAULT_INTERAKT: InteraktConfig = {
  enabled: false,
  api_key: "",
  country_code: "91",
  order_template: "order_confirmation",
  order_lang: "en",
  status_template: "order_status_update",
  status_lang: "en",
  admin_phone: "",
  status_events: ["confirmed", "ready", "shipped", "delivered"],
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "received",
  confirmed: "confirmed",
  in_production: "in production",
  ready: "ready",
  shipped: "shipped",
  delivered: "delivered",
  cancelled: "cancelled",
};

export async function getInteraktConfig(): Promise<InteraktConfig> {
  try {
    const row = await db.setting.findUnique({ where: { key: "interakt" } });
    if (row) return { ...DEFAULT_INTERAKT, ...(JSON.parse(row.value) as Partial<InteraktConfig>) };
  } catch {
    /* defaults */
  }
  return { ...DEFAULT_INTERAKT, api_key: process.env.INTERAKT_API_KEY || "" };
}

function splitPhone(raw: string, defaultCc: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length > 10) return { cc: digits.slice(0, digits.length - 10), phone: digits.slice(-10) };
  return { cc: defaultCc.replace(/\D/g, "") || "91", phone: digits };
}

/** WhatsApp template variables can't hold line breaks or long runs of spaces. */
const clean = (v: string) => v.replace(/[\r\n\t]+/g, " | ").replace(/ {2,}/g, " ").trim() || "-";

export async function sendInteraktTemplate(
  cfg: InteraktConfig,
  to: string,
  template: string,
  lang: string,
  bodyValues: string[],
): Promise<{ ok: boolean; error?: string }> {
  if (!cfg.api_key || !template) return { ok: false, error: "Interakt API key or template name missing" };
  const { cc, phone } = splitPhone(to, cfg.country_code);
  if (phone.length < 6) return { ok: false, error: "Invalid phone number" };
  try {
    const res = await fetch("https://api.interakt.ai/v1/public/message/", {
      method: "POST",
      headers: { Authorization: `Basic ${cfg.api_key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        countryCode: `+${cc}`,
        phoneNumber: phone,
        type: "Template",
        template: { name: template, languageCode: lang || "en", bodyValues: bodyValues.map(clean) },
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `Interakt ${res.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}

type Addr = {
  fullName?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  location?: string;
};

/** Template variables, in order. Keep in sync with the sample text on Admin → WhatsApp. */
async function orderVariables(orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return null;
  const hv = ((await getSiteConfig()).home_visit ?? DEFAULT_HOME_VISIT).option_label;
  let addr: Addr = {};
  try {
    addr = JSON.parse(order.shippingAddress || "{}");
  } catch {
    /* ignore */
  }
  const opts = order.items.map((i) => {
    try {
      return JSON.parse(i.options || "{}") as Record<string, string>;
    } catch {
      return {} as Record<string, string>;
    }
  });
  const onlyHomeVisit = opts.length > 0 && opts.every((o) => isHomeVisitLine(o, hv));
  const paid = order.paymentStatus === "paid";

  const items = order.items
    .map((i, n) => {
      const detail = Object.entries(opts[n])
        .filter(([k]) => k !== "Schedule" && k !== "Measurement")
        .map(([, v]) => v)
        .filter(Boolean)
        .join(", ");
      return `${i.name} x${i.qty}${detail ? ` (${detail})` : ""}`;
    })
    .join(" | ");
  const schedule =
    [...new Set(opts.map((o) => o.Schedule).filter(Boolean))].map((s) => s.replace("T", " ")).join(", ") || "-";
  const measurement = [...new Set(opts.map((o) => o.Measurement).filter(Boolean))].join(", ");
  const address =
    [addr.line1, addr.line2, addr.city, addr.state].filter(Boolean).join(", ") +
    (addr.pincode ? ` - ${addr.pincode}` : "") +
    (addr.location ? ` | Location: ${addr.location}` : "");

  return {
    order,
    vars: [
      addr.fullName || "Customer",
      order.orderNumber,
      items,
      formatINRShort(order.total),
      paid ? formatINRShort(order.total) : "Pay on delivery",
      onlyHomeVisit ? "Remaining amount is payable at the home visit" : paid ? "Nil" : formatINRShort(order.total),
      measurement && schedule !== "-" ? `${schedule} (${measurement})` : measurement || schedule,
      address,
    ],
  };
}

/** Order confirmation to the customer (and an optional copy to the owner). Never throws. */
export async function notifyOrderPlaced(orderId: string) {
  try {
    const cfg = await getInteraktConfig();
    if (!cfg.enabled) return;
    const data = await orderVariables(orderId);
    if (!data) return;
    const r = await sendInteraktTemplate(cfg, data.order.phone, cfg.order_template, cfg.order_lang, data.vars);
    if (!r.ok) console.error("[whatsapp] order message failed:", r.error);
    if (cfg.admin_phone) {
      const a = await sendInteraktTemplate(cfg, cfg.admin_phone, cfg.order_template, cfg.order_lang, data.vars);
      if (!a.ok) console.error("[whatsapp] admin copy failed:", a.error);
    }
  } catch (e) {
    console.error("[whatsapp] order notify error:", e);
  }
}

/** Status-change message. Never throws. */
export async function notifyOrderStatus(orderId: string, status: string) {
  try {
    const cfg = await getInteraktConfig();
    if (!cfg.enabled || !cfg.status_events.includes(status)) return;
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) return;
    let name = "Customer";
    try {
      name = (JSON.parse(order.shippingAddress || "{}") as Addr).fullName || name;
    } catch {
      /* ignore */
    }
    const r = await sendInteraktTemplate(cfg, order.phone, cfg.status_template, cfg.status_lang, [
      name,
      order.orderNumber,
      STATUS_LABELS[status] ?? status,
    ]);
    if (!r.ok) console.error("[whatsapp] status message failed:", r.error);
  } catch (e) {
    console.error("[whatsapp] status notify error:", e);
  }
}

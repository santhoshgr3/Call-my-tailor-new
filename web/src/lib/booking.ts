import "server-only";
import { z } from "zod";
import { db } from "./db";
import { getSiteConfig, resolveBooking } from "./settings";
import { isRazorpayEnabled } from "./razorpay";

export const BOOKING_STATUS_LIST = ["new", "confirmed", "visited", "delivered", "cancelled"] as const;
export const BOOKING_STATUS_LABEL: Record<string, string> = {
  new: "Pending",
  confirmed: "Confirmed",
  visited: "Visited",
  delivered: "Delivered",
  cancelled: "Cancelled",
  // older values from the previous booking form
  contacted: "Contacted",
  scheduled: "Scheduled",
  completed: "Completed",
};
export const PAYMENT_STATUS_LIST = ["unpaid", "reported", "paid", "not_required"] as const;
export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  unpaid: "Unpaid",
  reported: "Payment reported",
  paid: "Paid",
  not_required: "No payment needed",
};

export const bookingRequestSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  phone: z
    .string()
    .transform((v) => v.replace(/\D/g, "").slice(-10))
    .refine((v) => /^\d{10}$/.test(v), "Enter a valid 10-digit phone number"),
  email: z.string().trim().email("Enter a valid email").max(120),
  address: z.string().trim().min(1, "Address is required").max(300),
  city: z.string().trim().min(1, "City is required").max(80),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please select a date"),
  time: z.string().trim().min(1, "Please select a time slot").max(60),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  location: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || /^https:\/\/(www\.)?google\.com\/maps\?q=-?[\d.]+,-?[\d.]+$/.test(v), "Invalid location")
    .optional(),
  items: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        qty: z.number().int().min(1).max(20),
        hasFabric: z.enum(["yes", "no"]).default("no"),
      }),
    )
    .max(40)
    .default([]),
  designFiles: z
    .array(
      z.object({
        name: z.string().max(120),
        url: z.string().regex(/^\/media\/[A-Za-z0-9]+$/),
        type: z.string().max(60),
      }),
    )
    .max(6)
    .default([]),
});

export type BookingRequest = z.infer<typeof bookingRequestSchema>;

export type PaymentPlan =
  | { mode: "none" }
  | { mode: "link"; url: string }
  | { mode: "razorpay" };

/** Decide how the home-visit charge will be collected. */
export async function planPayment(charge: number): Promise<PaymentPlan> {
  if (charge <= 0) return { mode: "none" };
  const site = await getSiteConfig();
  const cfg = resolveBooking(site);
  const onlineOk = site.payments?.online_enabled !== false && (await isRazorpayEnabled());
  if (onlineOk) return { mode: "razorpay" };
  if (/^https?:\/\//i.test(cfg.payment_link)) return { mode: "link", url: cfg.payment_link };
  return { mode: "none" };
}

/** Catalogue lookup — prices always come from the database, never from the browser. */
export async function priceItems(items: { id: string; qty: number; hasFabric: "yes" | "no" }[]) {
  if (!items.length) return { lines: [], total: 0 };
  const rows = await db.serviceItem.findMany({
    where: { id: { in: items.map((i) => i.id) }, isActive: true },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  const lines = items
    .map((i) => {
      const r = byId.get(i.id);
      if (!r) return null;
      return {
        productId: r.id,
        title: r.title,
        category: r.category,
        price: r.stitching,
        qty: i.qty,
        image: r.image || null,
        hasFabric: i.hasFabric,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  return { lines, total: lines.reduce((s, l) => s + l.price * l.qty, 0) };
}

/** True when the date is today or later (India time). */
export function isFutureOrToday(dateStr: string) {
  const today = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
  return dateStr >= today;
}

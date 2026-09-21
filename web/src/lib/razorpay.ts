import "server-only";
import crypto from "node:crypto";
import { db } from "./db";

type Config = { keyId: string; keySecret: string };

/**
 * Razorpay credentials: saved from Admin → Payments (Setting row "razorpay"),
 * falling back to the RAZORPAY_* environment variables.
 * The secret is only ever read on the server and is never sent to the browser.
 */
export async function getRazorpayConfig(): Promise<Config> {
  try {
    const row = await db.setting.findUnique({ where: { key: "razorpay" } });
    if (row) {
      const v = JSON.parse(row.value) as { key_id?: string; key_secret?: string };
      if (v.key_id && v.key_secret) return { keyId: v.key_id, keySecret: v.key_secret };
    }
  } catch {
    /* fall back to env */
  }
  return {
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
  };
}

export async function isRazorpayEnabled() {
  const c = await getRazorpayConfig();
  return Boolean(c.keyId && c.keySecret);
}

export async function razorpayKeyId() {
  return (await getRazorpayConfig()).keyId;
}

type RzpOrder = { id: string; amount: number; currency: string; status: string };

export async function createRazorpayOrder(
  amountRupees: number,
  receipt: string,
): Promise<RzpOrder> {
  const { keyId, keySecret } = await getRazorpayConfig();
  if (!keyId || !keySecret) throw new Error("Razorpay is not configured");
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(amountRupees * 100), // paise
      currency: "INR",
      receipt,
      payment_capture: 1,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Razorpay order failed: ${res.status} ${text}`);
  }
  return (await res.json()) as RzpOrder;
}

export async function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string,
): Promise<boolean> {
  const { keySecret } = await getRazorpayConfig();
  if (!keySecret) return false;
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

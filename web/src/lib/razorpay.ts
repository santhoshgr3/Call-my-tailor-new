import "server-only";
import crypto from "node:crypto";

const KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

export function isRazorpayEnabled() {
  return Boolean(KEY_ID && KEY_SECRET);
}

export function razorpayKeyId() {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || KEY_ID;
}

type RzpOrder = { id: string; amount: number; currency: string; status: string };

export async function createRazorpayOrder(
  amountRupees: number,
  receipt: string,
): Promise<RzpOrder> {
  if (!isRazorpayEnabled()) throw new Error("Razorpay is not configured");
  const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");
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

export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string,
): boolean {
  if (!KEY_SECRET) return false;
  const expected = crypto
    .createHmac("sha256", KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

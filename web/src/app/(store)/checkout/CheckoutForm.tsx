"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { formatINR } from "@/lib/money";

type Defaults = {
  email: string;
  phone: string;
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
};

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function CheckoutForm({
  defaults,
  loggedIn,
  razorpayEnabled,
}: {
  defaults: Defaults;
  loggedIn: boolean;
  razorpayEnabled: boolean;
}) {
  const router = useRouter();
  const { lines, subtotal, clear, ready } = useCart();
  const [form, setForm] = useState<Defaults>(defaults);
  const [payment, setPayment] = useState<"cod" | "razorpay">("cod");
  const [coupon, setCoupon] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const shipping = subtotal >= 4999 || subtotal === 0 ? 0 : 199;
  const total = subtotal + shipping;

  function set<K extends keyof Defaults>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function finishSuccess(orderNumber: string) {
    clear();
    router.push(`/checkout/success?order=${orderNumber}`);
  }

  async function openRazorpay(
    data: {
      orderId: string;
      orderNumber: string;
      razorpay: { keyId: string; orderId: string; amount: number; currency: string };
    },
  ) {
    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) {
      setError("Could not load the payment gateway. Please try Pay on delivery.");
      setBusy(false);
      return;
    }
    const rzp = new window.Razorpay({
      key: data.razorpay.keyId,
      amount: data.razorpay.amount,
      currency: data.razorpay.currency,
      name: "Call My Tailor",
      description: `Order ${data.orderNumber}`,
      order_id: data.razorpay.orderId,
      prefill: { name: form.fullName, email: form.email, contact: form.phone },
      theme: { color: "#eb3740" },
      handler: async (resp: RazorpayResponse) => {
        const v = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ orderId: data.orderId, ...resp }),
        });
        if (v.ok) {
          await finishSuccess(data.orderNumber);
        } else {
          setError("Payment could not be verified. If you were charged, contact support.");
          setBusy(false);
        }
      },
      modal: {
        ondismiss: () => {
          setBusy(false);
          setError(
            `Payment cancelled. Order ${data.orderNumber} is saved as unpaid — you can pay later or contact us.`,
          );
        },
      },
    });
    rzp.open();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          paymentMethod: payment,
          couponCode: coupon,
          notes,
          items: lines.map((l) => ({
            productId: l.productId,
            qty: l.qty,
            options: l.options,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not place order.");
        setBusy(false);
        return;
      }
      if (data.razorpay) {
        await openRazorpay(data);
        return;
      }
      if (data.warning) {
        // order placed but online payment fell through
        await finishSuccess(data.orderNumber);
        return;
      }
      await finishSuccess(data.orderNumber);
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  if (ready && lines.length === 0) {
    return (
      <div className="rounded border border-line p-12 text-center">
        <p className="text-sm text-faint">Your cart is empty.</p>
        <Link href="/" className="btn-brand mt-4">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const field = "w-full border border-line px-3 py-2 text-sm outline-none focus:border-brand";

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        {!loggedIn && (
          <p className="rounded border border-line bg-soft p-3 text-xs text-muted">
            Checking out as guest.{" "}
            <Link href="/account/login?next=/checkout" className="font-semibold text-brand">
              Login
            </Link>{" "}
            to track your orders.
          </p>
        )}

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase">Contact</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className={field}
              placeholder="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
            <input
              className={field}
              placeholder="Phone"
              required
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase">Shipping Address</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className={`${field} sm:col-span-2`}
              placeholder="Full name"
              required
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
            />
            <input
              className={`${field} sm:col-span-2`}
              placeholder="Address line 1"
              required
              value={form.line1}
              onChange={(e) => set("line1", e.target.value)}
            />
            <input
              className={`${field} sm:col-span-2`}
              placeholder="Address line 2 (optional)"
              value={form.line2}
              onChange={(e) => set("line2", e.target.value)}
            />
            <input
              className={field}
              placeholder="City"
              required
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            />
            <input
              className={field}
              placeholder="State"
              required
              value={form.state}
              onChange={(e) => set("state", e.target.value)}
            />
            <input
              className={field}
              placeholder="Pincode"
              required
              value={form.pincode}
              onChange={(e) => set("pincode", e.target.value)}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase">Payment</h2>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="pay"
                checked={payment === "cod"}
                onChange={() => setPayment("cod")}
              />
              Cash / Pay on delivery (or after home trial)
            </label>
            <label
              className={`flex items-center gap-2 ${razorpayEnabled ? "" : "text-faint"}`}
            >
              <input
                type="radio"
                name="pay"
                disabled={!razorpayEnabled}
                checked={payment === "razorpay"}
                onChange={() => setPayment("razorpay")}
              />
              Pay online with Razorpay
              {!razorpayEnabled && " (set RAZORPAY_KEY_ID in .env to enable)"}
            </label>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase">Order Notes</h2>
          <textarea
            className={field}
            rows={3}
            placeholder="Measurement preferences, delivery instructions…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </section>
      </div>

      <aside className="h-fit rounded border border-line p-5 text-sm">
        <h3 className="mb-3 text-sm font-bold uppercase">Your Order</h3>
        <ul className="mb-3 space-y-2">
          {lines.map((l) => (
            <li key={l.key} className="flex justify-between gap-2">
              <span className="text-muted">
                {l.name} × {l.qty}
              </span>
              <span>{formatINR(l.price * l.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            className={field}
            placeholder="Coupon code"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
          />
        </div>
        <p className="mt-1 text-[11px] text-faint">Try WELCOME10 for 10% off orders over ₹3,000</p>

        <div className="mt-3 space-y-1 border-t border-line pt-3">
          <div className="flex justify-between">
            <span className="text-muted">Subtotal</span>
            <span>{formatINR(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Shipping</span>
            <span>{shipping ? formatINR(shipping) : "Free"}</span>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
            <span>Total</span>
            <span className="text-brand">{formatINR(total)}</span>
          </div>
        </div>

        {error && <p className="mt-3 text-xs text-brand">{error}</p>}

        <button className="btn-brand mt-4 w-full" disabled={busy}>
          {busy ? "Processing…" : payment === "razorpay" ? "Pay Now" : "Place Order"}
        </button>
        <p className="mt-2 text-[11px] text-faint">
          Final amount is recalculated on the server, including any option pricing.
        </p>
      </aside>
    </form>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useVisit } from "./BookingProvider";
import { formatINRShort } from "@/lib/money";

type Cfg = {
  formEyebrow: string;
  formTitle: string;
  notice: string;
  emptyNote: string;
  successTitle: string;
  successSteps: string[];
  timeSlots: string[];
  visitCharge: number;
  paymentAvailable: boolean;
  phoneDisplay: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type Form = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  date: string;
  time: string;
  notes: string;
  location: string;
};

const INITIAL: Form = { name: "", phone: "", email: "", address: "", city: "", date: "", time: "", notes: "", location: "" };
const SESSION_KEY = "cmt_visit_booking";

type Preview = { name: string; previewUrl: string | null };

/** Shrink large photos so they stay under the upload limit. */
async function prepareFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.size < 1_200_000) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/webp", 0.85));
    if (blob && blob.size < file.size) {
      return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
    }
  } catch {
    /* use the original */
  }
  return file;
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

const field =
  "w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-300 focus:border-brand focus:ring-2 focus:ring-brand/30";

export function BookingForm({ cfg }: { cfg: Cfg }) {
  const { cart, totalPrice, clear, ready } = useVisit();
  const params = useSearchParams();
  const [form, setForm] = useState<Form>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [designFiles, setDesignFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState("");
  const [done, setDone] = useState<null | { paid: boolean }>(null);
  const [pending, setPending] = useState<null | { id: string; payment: RzpPayment }>(null);
  const today = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

  type RzpPayment = { keyId: string; orderId: string; amount: number; currency: string };

  // Returning from the Razorpay payment link
  useEffect(() => {
    if (params.get("payment") !== "success") return;
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const data = JSON.parse(saved) as { id: string } & Partial<Form>;
        setForm((f) => ({ ...f, name: data.name ?? "", phone: data.phone ?? "", date: data.date ?? "", time: data.time ?? "" }));
        if (data.id) {
          fetch("/api/book-visit/return", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ bookingId: data.id }),
          }).catch(() => {});
        }
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      /* ignore */
    }
    setDone({ paid: true });
  }, [params]);

  const set = (name: keyof Form, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  function getLocation() {
    if (!navigator.geolocation) {
      setLocError("Location is not supported by your browser.");
      return;
    }
    setLocLoading(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("location", `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`);
        setLocLoading(false);
      },
      (err) => {
        setLocLoading(false);
        setLocError(
          err.code === err.PERMISSION_DENIED
            ? "Location access denied. Please enable location permissions."
            : err.code === err.TIMEOUT
              ? "Location request timed out."
              : "Location information unavailable.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const valid = Array.from(files).filter((f) => f.type.startsWith("image/") || f.type === "application/pdf");
    const room = 6 - designFiles.length;
    const take = valid.slice(0, Math.max(0, room));
    setDesignFiles((p) => [...p, ...take]);
    take.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const r = new FileReader();
        r.onload = (e) => setPreviews((p) => [...p, { name: file.name, previewUrl: String(e.target?.result) }]);
        r.readAsDataURL(file);
      } else {
        setPreviews((p) => [...p, { name: file.name, previewUrl: null }]);
      }
    });
  }

  function removeFile(i: number) {
    setDesignFiles((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  }

  function validate() {
    const e: Partial<Record<keyof Form, string>> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, "").slice(-10)) || form.phone.replace(/\D/g, "").length < 10)
      e.phone = "Enter a valid 10-digit phone number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Enter a valid email";
    if (!form.address.trim()) e.address = "Address is required";
    if (!form.city.trim()) e.city = "City is required";
    if (!form.date) e.date = "Please select a date";
    if (!form.time) e.time = "Please select a time slot";
    return e;
  }

  async function finish(paid: boolean) {
    clear();
    setPending(null);
    setDone({ paid });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function payOnline(id: string, p: RzpPayment) {
    const ok = await loadRazorpay();
    if (!ok || !window.Razorpay) {
      setServerError("Could not load the payment gateway. Your booking is saved — please try again.");
      setPending({ id, payment: p });
      setLoading(false);
      return;
    }
    const rzp = new window.Razorpay({
      key: p.keyId,
      amount: p.amount,
      currency: p.currency,
      name: "Call My Tailor",
      description: "Home visit charge",
      order_id: p.orderId,
      prefill: { name: form.name, email: form.email, contact: form.phone },
      theme: { color: "#eb3740" },
      handler: async (resp: Record<string, string>) => {
        const v = await fetch("/api/book-visit/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ bookingId: id, ...resp }),
        });
        if (v.ok) await finish(true);
        else {
          setServerError("We could not verify the payment. If you were charged, please contact us.");
          setLoading(false);
        }
      },
      modal: {
        ondismiss: () => {
          setLoading(false);
          setPending({ id, payment: p });
          setServerError("Payment was not completed. Your booking is saved — you can pay now to confirm it.");
        },
      },
    });
    rzp.open();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      const first = Object.keys(errs)[0];
      document.querySelector(`[name="${first}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setLoading(true);
    try {
      const uploaded: { name: string; url: string; type: string }[] = [];
      for (const file of designFiles) {
        const body = new FormData();
        body.append("file", await prepareFile(file));
        const res = await fetch("/api/book-visit/upload", { method: "POST", body });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) throw new Error(data.error || `Could not upload ${file.name}.`);
        uploaded.push({ name: file.name, url: data.url, type: data.type || file.type });
      }

      const res = await fetch("/api/book-visit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: cart.map((i) => ({ id: i.id, qty: i.qty, hasFabric: i.hasFabric })),
          designFiles: uploaded,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "Booking could not be saved. Please try again.");

      const pay = data.payment as { mode: string; url?: string } & Partial<RzpPayment>;
      if (pay.mode === "link" && pay.url) {
        try {
          sessionStorage.setItem(
            SESSION_KEY,
            JSON.stringify({ id: data.id, name: form.name, phone: form.phone, date: form.date, time: form.time }),
          );
        } catch {
          /* ignore */
        }
        clear();
        window.location.href = pay.url;
        return;
      }
      if (pay.mode === "razorpay" && pay.orderId) {
        await payOnline(data.id, pay as RzpPayment);
        return;
      }
      await finish(false);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      if (!pending) setLoading(false);
    }
  }

  const noticeParts = cfg.notice.split("{charge}");

  /* ---------- confirmation ---------- */
  if (done) {
    const steps = done.paid ? cfg.successSteps : ["Booking received", ...cfg.successSteps.slice(1)];
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#f8f4ee] px-4 py-12">
        <div className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-2xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl text-green-500">
            ✓
          </div>
          <h2 className="mb-3 text-3xl font-bold text-[#1a2744]">
            {done.paid ? cfg.successTitle : "Booking Received!"}
          </h2>
          {form.name && (
            <p className="mb-2 leading-relaxed text-muted">
              Thank you, <strong>{form.name}</strong>!{" "}
              {done.paid ? "Your payment was received and home visit is scheduled." : "Our team will confirm your home visit shortly."}
            </p>
          )}
          {form.date && (
            <p className="mb-1 text-sm text-muted">
              📅 {new Date(form.date + "T00:00:00").toDateString()} · {form.time}
            </p>
          )}
          {form.phone && (
            <p className="mb-6 text-sm text-muted">
              Our tailor will call you at <strong>{form.phone}</strong> before the visit.
            </p>
          )}
          <div className="mb-8 rounded-2xl bg-[#f8f4ee] p-4 text-left">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-faint">What&apos;s next?</p>
            {steps.map((s) => (
              <div key={s} className="flex items-center gap-2 py-1 text-sm text-muted">
                <span className="text-brand">✓</span> {s}
              </div>
            ))}
          </div>
          <Link href="/" className="btn-brand mb-3 w-full">
            Visit Website
          </Link>
          <Link href="/book-visit" className="block w-full py-2 text-center text-sm text-muted hover:text-[#1a2744]">
            Back to Booking
          </Link>
        </div>
      </main>
    );
  }

  /* ---------- form ---------- */
  return (
    <main className="bg-[#f8f4ee]">
      <div className="bg-[#111c35] py-12 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand">{cfg.formEyebrow}</p>
        <h1 className="text-4xl font-bold text-white md:text-5xl">{cfg.formTitle}</h1>
      </div>

      <div className="container-cmt py-10 md:py-12">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
          {/* Left: summary */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-6 shadow-md">
              <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-[#1a2744]">
                <span className="text-brand">🛍</span> Selected Items
              </h2>
              {!ready || cart.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-2xl text-brand">
                    🏠
                  </div>
                  <p className="mb-1 text-sm font-semibold text-[#1a2744]">Home Visit Booking</p>
                  <p className="mx-auto max-w-xs text-xs leading-relaxed text-faint">{cfg.emptyNote}</p>
                  <Link href="/book-visit" className="mt-4 inline-block text-xs font-semibold text-brand hover:underline">
                    Browse services →
                  </Link>
                </div>
              ) : (
                <>
                  <div className="max-h-80 space-y-4 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image} alt={item.title} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#1a2744]">{item.title}</p>
                          <p className="text-xs capitalize text-faint">
                            {item.category} · Fabric: {item.hasFabric === "yes" ? "I have it" : "Need from you"}
                          </p>
                          <p className="text-sm font-bold text-brand">
                            {formatINRShort(item.price)} × {item.qty}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 space-y-2 border-t border-line pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Stitching Estimate</span>
                      <span className="font-semibold text-[#1a2744]">{formatINRShort(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between border-t border-line pt-2">
                      <span className="font-semibold text-ink">Total Estimate</span>
                      <span className="text-xl font-bold text-[#1a2744]">{formatINRShort(totalPrice)}</span>
                    </div>
                    <Link href="/book-visit" className="inline-block pt-1 text-xs font-semibold text-brand hover:underline">
                      Change selection
                    </Link>
                  </div>
                </>
              )}
            </div>

            {cfg.visitCharge > 0 && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
                <span className="mt-0.5 shrink-0 text-red-500">⚠</span>
                <p className="text-sm text-red-800">
                  {noticeParts.map((part, i) => (
                    <span key={i}>
                      {part}
                      {i < noticeParts.length - 1 && <span className="font-bold">{formatINRShort(cfg.visitCharge)}</span>}
                    </span>
                  ))}
                </p>
              </div>
            )}
          </div>

          {/* Right: form */}
          <form onSubmit={submit} noValidate className="space-y-6 rounded-2xl bg-white p-6 shadow-md sm:p-8">
            <div>
              <h2 className="text-xl font-bold text-[#1a2744]">Your Details</h2>
              <p className="mt-1 text-xs text-faint">
                Fields marked <span className="text-red-500">*</span> are required
              </p>
            </div>

            {(Object.keys(errors).length > 0 || serverError) && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <span className="mt-0.5 shrink-0 text-red-500">⚠</span>
                <p className="text-sm text-red-700">
                  {serverError || "Please fill in all required fields before submitting."}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Input label="Full Name *" name="name" placeholder="Priya Sharma" value={form.name} onChange={set} error={errors.name} />
              <Input label="Phone Number *" name="phone" type="tel" placeholder="98765 43210" value={form.phone} onChange={set} error={errors.phone} />
            </div>
            <Input label="Email Address *" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={set} error={errors.email} />
            <Input
              label="Full Address *"
              name="address"
              textarea
              placeholder="Flat no., Building, Street, Area..."
              value={form.address}
              onChange={set}
              error={errors.address}
            />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Input label="City *" name="city" placeholder="Delhi" value={form.city} onChange={set} error={errors.city} />
              <Input label="Preferred Date *" name="date" type="date" min={today} value={form.date} onChange={set} error={errors.date} />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1a2744]">Preferred Time Slot *</label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {cfg.timeSlots.map((slot) => (
                  <label key={slot} className="cursor-pointer">
                    <input
                      type="radio"
                      name="time"
                      value={slot}
                      checked={form.time === slot}
                      onChange={() => set("time", slot)}
                      className="sr-only"
                    />
                    <div
                      className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                        form.time === slot
                          ? "border-brand bg-brand/10 text-[#1a2744]"
                          : "border-gray-200 text-muted hover:border-brand"
                      }`}
                    >
                      {slot}
                    </div>
                  </label>
                ))}
              </div>
              {errors.time && <p className="mt-1 text-xs text-red-500">{errors.time}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1a2744]">
                Additional Notes <span className="font-normal text-faint">(optional)</span>
              </label>
              <textarea
                name="notes"
                rows={3}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Any special requests or fabric preferences..."
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none placeholder:text-gray-300 focus:border-brand focus:ring-2 focus:ring-brand/30"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1a2744]">
                Share Your Location <span className="font-normal text-faint">(optional)</span>
              </label>
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                    📍
                  </div>
                  <div className="flex-1">
                    <p className="mb-1 text-sm font-medium text-gray-800">Share Your Location</p>
                    <p className="text-xs leading-relaxed text-muted">
                      Tap the button to fetch your current location. This helps our tailor find your address easily.
                    </p>
                  </div>
                </div>
                {!form.location ? (
                  <button
                    type="button"
                    onClick={getLocation}
                    disabled={locLoading}
                    className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
                      locLoading ? "cursor-not-allowed bg-gray-300 text-gray-500" : "bg-green-500 text-white hover:bg-green-600"
                    }`}
                  >
                    {locLoading ? "Fetching location…" : "Get My Location"}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 rounded-lg border border-green-300 bg-white p-3">
                      <span className="text-green-600">✓</span>
                      <span className="flex-1 text-sm text-gray-700">Location captured successfully!</span>
                      <button type="button" onClick={() => set("location", "")} className="p-1 text-red-500 hover:text-red-600" aria-label="Remove location">
                        ✕
                      </button>
                    </div>
                    <a href={form.location} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-green-700 hover:text-green-800">
                      View location on map ↗
                    </a>
                  </div>
                )}
                {locError && <p className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{locError}</p>}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1a2744]">
                Upload Your Design <span className="font-normal text-faint">(optional · images or PDF)</span>
              </label>
              <label
                htmlFor="design-upload"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  addFiles(e.dataTransfer.files);
                }}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand/40 bg-brand/5 px-4 py-6 text-center transition-colors hover:border-brand hover:bg-brand/10"
              >
                <span className="text-3xl text-brand">⬆</span>
                <p className="text-sm text-muted">
                  <span className="font-semibold text-[#1a2744]">Click to upload</span> or drag &amp; drop
                </p>
                <p className="text-xs text-faint">PNG, JPG, WEBP, PDF — share your design reference (up to 6 files)</p>
                <input
                  id="design-upload"
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  className="sr-only"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
              {previews.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {previews.map((p, i) => (
                    <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-line">
                      {p.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.previewUrl} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-soft p-2">
                          <span className="mb-1 text-2xl text-red-400">📄</span>
                          <p className="w-full truncate text-center text-xs text-muted">{p.name}</p>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow"
                        aria-label="Remove file"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {pending ? (
              <button
                type="button"
                onClick={() => {
                  setServerError("");
                  setLoading(true);
                  payOnline(pending.id, pending.payment);
                }}
                className="btn-brand w-full !py-4 text-base"
              >
                Pay {formatINRShort(cfg.visitCharge)} to confirm booking
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className={`btn-brand w-full !py-4 text-base ${loading ? "cursor-not-allowed opacity-60" : ""}`}
              >
                {loading ? "Confirming…" : cfg.visitCharge > 0 && cfg.paymentAvailable ? "Proceed to Payment" : "Confirm Booking"}
              </button>
            )}
            <p className="text-center text-xs text-faint">Need help? Call {cfg.phoneDisplay}</p>
          </form>
        </div>
      </div>
    </main>
  );
}

function Input({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  min,
  textarea,
}: {
  label: string;
  name: keyof Form;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (name: keyof Form, value: string) => void;
  error?: string;
  min?: string;
  textarea?: boolean;
}) {
  const cls = `${field} ${error ? "border-red-400 bg-red-50" : "border-gray-200"}`;
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#1a2744]">{label}</label>
      {textarea ? (
        <textarea
          name={name}
          rows={3}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder}
          className={`${cls} resize-none`}
        />
      ) : (
        <input
          name={name}
          type={type}
          min={min}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder}
          className={cls}
        />
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

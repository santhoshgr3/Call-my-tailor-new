import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/settings";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = { title: "Contact Us" };

export default async function ContactPage() {
  const site = await getSiteConfig();
  const c = site.contact;

  return (
    <div className="container-cmt py-10">
      <h1 className="section-title">Contact Us</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="rounded border border-line p-6">
          <h3 className="mb-2 text-sm font-bold uppercase">Visit Our Store</h3>
          <p className="text-sm text-muted">{c?.address}</p>
        </div>
        <div className="rounded border border-line p-6">
          <h3 className="mb-2 text-sm font-bold uppercase">24/7 Quick Contact</h3>
          <p className="text-sm text-muted">Phone: {c?.phone}</p>
          <p className="text-sm text-muted">Email: {c?.email}</p>
          <p className="text-sm text-muted">WhatsApp: {c?.phone}</p>
        </div>
        <div className="rounded border border-line p-6">
          <h3 className="mb-2 text-sm font-bold uppercase">Working Hours</h3>
          <p className="text-sm text-muted">{c?.hours}</p>
          {(c?.people ?? []).map((p) => (
            <p key={p.name} className="mt-1 text-sm text-muted">
              {p.role}: <span className="font-semibold">{p.name}</span>
            </p>
          ))}
        </div>
      </div>

      <div className="mt-10 max-w-2xl">
        <h2 className="mb-4 text-xl">Send us a message</h2>
        <ContactForm />
      </div>
    </div>
  );
}

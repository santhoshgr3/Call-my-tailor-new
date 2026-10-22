import type { Metadata } from "next";
import { db } from "@/lib/db";
import { LegacyPage, isLegacyHtml } from "@/components/legacy/LegacyPage";
import { ContactForm } from "./ContactForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Contact Call My Tailor | Tailoring Service Delhi NCR",
  description: "Get in touch with Call My Tailor — visit our store, call, WhatsApp or send us a message.",
};

/** Layout and text come from the stored page (Admin → Pages → contact-us); the form below is live. */
export default async function ContactPage() {
  const page = await db.infoPage.findUnique({ where: { slug: "contact-us" } }).catch(() => null);
  if (!page || !isLegacyHtml(page.contentHtml)) {
    return (
      <div className="container-cmt py-10">
        <h1 className="section-title">Contact Us</h1>
        <div className="mx-auto mt-8 max-w-2xl">
          <ContactForm />
        </div>
      </div>
    );
  }
  return <LegacyPage html={page.contentHtml} slots={{ "cmt-contact-form": <ContactForm /> }} />;
}

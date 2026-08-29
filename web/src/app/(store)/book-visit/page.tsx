import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/settings";
import { db } from "@/lib/db";
import { BookVisitForm } from "./BookVisitForm";

export const metadata: Metadata = {
  title: "Book a Home Visit",
  description:
    "Book a free doorstep visit. Our tailor comes to your home, takes measurements and helps you pick from 2000+ fabrics.",
};

export default async function BookVisitPage() {
  const site = await getSiteConfig();
  const cats = await db.category.findMany({
    where: { parentId: null, isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { name: true, slug: true },
  });

  return (
    <div className="container-cmt py-10">
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <h1 className="text-3xl">Book a Free Home Visit</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted">
            Why go anywhere? Our expert tailor visits your home or office at a convenient time,
            takes precise measurements and brings fabric swatches from 2000+ options. Fill the form
            and our team will confirm your slot.
          </p>
          <div className="mt-6">
            <BookVisitForm categories={cats} />
          </div>
        </div>

        <aside className="h-fit rounded border border-line bg-soft p-6 text-sm">
          <h2 className="mb-3 text-sm font-bold uppercase">Need help now?</h2>
          <p className="text-muted">
            Call us at{" "}
            <a href={`tel:${site.contact?.phone_raw}`} className="font-semibold text-brand">
              {site.contact?.phone}
            </a>
          </p>
          <p className="mt-1 text-muted">
            WhatsApp:{" "}
            <a
              href={`https://api.whatsapp.com/send?phone=${site.contact?.whatsapp}`}
              className="font-semibold text-brand"
            >
              {site.contact?.phone}
            </a>
          </p>
          <p className="mt-3 text-muted">{site.contact?.hours}</p>
          <p className="mt-3 text-muted">{site.contact?.address}</p>
        </aside>
      </div>
    </div>
  );
}

import { getSiteConfig, resolveBooking } from "@/lib/settings";
import { PageHeader, Card, Field, inputCls, SubmitButton } from "@/components/admin/ui";
import { ImageField } from "@/components/admin/ImageField";
import { Repeater, StringList } from "@/components/admin/Repeater";
import { BookingTabs } from "@/components/admin/BookingTabs";
import {
  saveBookingHero,
  saveBookingCategories,
  saveBookingSteps,
  saveBookingPayment,
  saveBookingTexts,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function BookingSettings() {
  const site = await getSiteConfig();
  const c = resolveBooking(site);

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Booking page"
        subtitle="Everything on /book-visit: hero, categories, how it works, visit charge, time slots and messages. Each block saves on its own."
      />
      <BookingTabs />

      <Card>
        <form action={saveBookingHero} className="space-y-4">
          <h2 className="font-bold">Hero &amp; headings</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Small heading above title" className="sm:col-span-2">
              <input name="eyebrow" defaultValue={c.eyebrow} className={inputCls} />
            </Field>
            <Field label="Title (line 1)">
              <input name="title_line1" defaultValue={c.title_line1} className={inputCls} />
            </Field>
            <Field label="Title (highlighted)">
              <input name="title_accent" defaultValue={c.title_accent} className={inputCls} />
            </Field>
            <Field label="Sub-title" className="sm:col-span-2">
              <input name="subtitle" defaultValue={c.subtitle} className={inputCls} />
            </Field>
            <Field label="Paragraph" className="sm:col-span-2">
              <textarea name="body" rows={3} defaultValue={c.body} className={inputCls} />
            </Field>
            <Field label="Hero image" className="sm:col-span-2">
              <ImageField name="hero_image" defaultValue={c.hero_image} />
            </Field>
            <Field label="Button label">
              <input name="cta_label" defaultValue={c.cta_label} className={inputCls} />
            </Field>
            <span />
            <Field label="“Choose a category” heading">
              <input name="select_heading" defaultValue={c.select_heading} className={inputCls} />
            </Field>
            <Field label="“Choose a category” text">
              <input name="select_intro" defaultValue={c.select_intro} className={inputCls} />
            </Field>
          </div>
          <div>
            <span className="mb-1 block text-xs font-bold uppercase text-faint">Stats</span>
            <Repeater
              name="stats"
              initial={c.stats}
              fields={[
                { key: "value", label: "Value", placeholder: "5,485+" },
                { key: "label", label: "Label", placeholder: "Happy Clients" },
              ]}
              addLabel="Add stat"
            />
          </div>
          <SubmitButton>Save hero</SubmitButton>
        </form>
      </Card>

      <Card>
        <form action={saveBookingCategories} className="space-y-3">
          <h2 className="font-bold">Categories</h2>
          <p className="text-xs text-faint">
            Each category opens its own catalog at <code>/book-visit/&lt;slug&gt;</code>. The slug ties a category to
            its items under “Services &amp; prices” — if you change a slug, existing items stay under the old one.
          </p>
          <Repeater
            name="categories"
            initial={c.categories}
            fields={[
              { key: "slug", label: "Slug", placeholder: "mens" },
              { key: "label", label: "Name", placeholder: "Men's Tailoring" },
              { key: "desc", label: "Card description", type: "textarea" },
              { key: "subtitle", label: "Banner sub-title" },
              { key: "image", label: "Card image", type: "image" },
              { key: "banner", label: "Banner image", type: "image" },
            ]}
            addLabel="Add category"
          />
          <SubmitButton>Save categories</SubmitButton>
        </form>
      </Card>

      <Card>
        <form action={saveBookingSteps} className="space-y-4">
          <h2 className="font-bold">How it works &amp; feature strip</h2>
          <Repeater
            name="steps"
            initial={c.steps}
            fields={[
              { key: "title", label: "Title" },
              { key: "sub", label: "Sub text" },
              { key: "image", label: "Icon image", type: "image" },
            ]}
            addLabel="Add step"
          />
          <div>
            <span className="mb-1 block text-xs font-bold uppercase text-faint">Feature strip (bottom)</span>
            <Repeater
              name="features"
              initial={c.features}
              fields={[
                { key: "icon", label: "Icon (emoji)", placeholder: "🧵" },
                { key: "title", label: "Title" },
                { key: "sub", label: "Sub text" },
              ]}
              addLabel="Add feature"
            />
          </div>
          <SubmitButton>Save steps &amp; features</SubmitButton>
        </form>
      </Card>

      <Card>
        <form action={saveBookingPayment} className="space-y-4">
          <h2 className="font-bold">Visit charge, payment &amp; time slots</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Home visit charge (₹)" hint="Set 0 for a free visit — no payment step is shown.">
              <input name="visit_charge" type="number" min={0} defaultValue={c.visit_charge} className={inputCls} />
            </Field>
            <Field
              label="Payment link (fallback)"
              hint="Used only when Razorpay keys are not saved in Admin → Payments. Must start with https://"
            >
              <input name="payment_link" defaultValue={c.payment_link} placeholder="https://rzp.io/…" className={inputCls} />
            </Field>
            <Field label="Notice shown on the form" hint="Use {charge} where the amount should appear." className="sm:col-span-2">
              <textarea name="notice" rows={2} defaultValue={c.notice} className={inputCls} />
            </Field>
          </div>
          <div>
            <span className="mb-1 block text-xs font-bold uppercase text-faint">Time slots</span>
            <StringList name="time_slots" initial={c.time_slots} addLabel="Add slot" placeholder="09:00 AM – 11:00 AM" />
          </div>
          <SubmitButton>Save payment &amp; slots</SubmitButton>
        </form>
      </Card>

      <Card>
        <form action={saveBookingTexts} className="space-y-4">
          <h2 className="font-bold">Booking form &amp; confirmation messages</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Form small heading">
              <input name="form_eyebrow" defaultValue={c.form_eyebrow} className={inputCls} />
            </Field>
            <Field label="Form title">
              <input name="form_title" defaultValue={c.form_title} className={inputCls} />
            </Field>
            <Field label="Text when nothing is selected" className="sm:col-span-2">
              <textarea name="empty_note" rows={2} defaultValue={c.empty_note} className={inputCls} />
            </Field>
            <Field label="Confirmation title" className="sm:col-span-2">
              <input name="success_title" defaultValue={c.success_title} className={inputCls} />
            </Field>
          </div>
          <div>
            <span className="mb-1 block text-xs font-bold uppercase text-faint">What happens next (confirmation steps)</span>
            <StringList name="success_steps" initial={c.success_steps} addLabel="Add step" />
          </div>
          <SubmitButton>Save messages</SubmitButton>
        </form>
      </Card>
    </div>
  );
}

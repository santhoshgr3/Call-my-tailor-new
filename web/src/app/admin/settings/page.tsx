import { getSetting, getSiteConfig, DEFAULT_HOME_VISIT } from "@/lib/settings";
import { PageHeader, Card, Field, inputCls, SubmitButton } from "@/components/admin/ui";
import { ImageField } from "@/components/admin/ImageField";
import { Repeater, StringList } from "@/components/admin/Repeater";
import { saveGeneralSettings } from "./actions";

export const dynamic = "force-dynamic";

const SOCIALS = ["instagram", "facebook", "linkedin", "youtube", "pinterest"] as const;

export default async function AdminSettings() {
  const site = await getSiteConfig();
  const seo = await getSetting<{ default_title: string; default_description: string }>("seo", {
    default_title: "",
    default_description: "",
  });
  const hv = site.home_visit ?? DEFAULT_HOME_VISIT;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Site Settings"
        subtitle="Brand, contact, navigation, social links and SEO — shown across the whole storefront"
      />
      <form action={saveGeneralSettings} className="space-y-6">
        <Card>
          <h2 className="mb-3 font-bold">Brand</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Brand name">
              <input name="brand" defaultValue={site.brand} className={inputCls} />
            </Field>
            <Field label="Tagline">
              <input name="tagline" defaultValue={site.tagline} className={inputCls} />
            </Field>
            <Field label="Logo" className="sm:col-span-2" hint="Shown in the header and footer. Leave blank for the default logo.">
              <ImageField name="logo" defaultValue={site.logo ?? ""} placeholder="/logo.png" />
            </Field>
            <Field label="Booking URL" className="sm:col-span-2">
              <input name="booking_url" defaultValue={site.booking_url} className={inputCls} />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="mb-1 font-bold">Header</h2>
          <p className="mb-4 text-xs text-faint">
            Category menus are built automatically from Admin → Categories.
          </p>
          <div className="space-y-5">
            <div>
              <span className="mb-1 block text-xs font-bold uppercase text-faint">
                Top bar messages
              </span>
              <StringList name="top_bar" initial={site.top_bar ?? []} addLabel="Add message" />
            </div>
            <div>
              <span className="mb-1 block text-xs font-bold uppercase text-faint">
                Extra menu links (next to Home / Collection)
              </span>
              <Repeater
                name="header_links"
                initial={site.header_links?.length ? site.header_links : [
                  { label: "Book Home Visit", href: "/book-visit" },
                  { label: "Blog", href: "/blog" },
                ]}
                fields={[
                  { key: "label", label: "Label" },
                  { key: "href", label: "Link", placeholder: "/blog" },
                ]}
                addLabel="Add menu link"
              />
            </div>
            <div>
              <span className="mb-1 block text-xs font-bold uppercase text-faint">Top tags</span>
              <StringList name="top_tags" initial={site.top_tags ?? []} addLabel="Add tag" />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-bold">Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Address" className="sm:col-span-2">
              <input name="c_address" defaultValue={site.contact?.address} className={inputCls} />
            </Field>
            <Field label="Phone (display)">
              <input name="c_phone" defaultValue={site.contact?.phone} className={inputCls} />
            </Field>
            <Field label="Phone (digits only)">
              <input name="c_phone_raw" defaultValue={site.contact?.phone_raw} className={inputCls} />
            </Field>
            <Field label="WhatsApp number (digits)">
              <input name="c_whatsapp" defaultValue={site.contact?.whatsapp} className={inputCls} />
            </Field>
            <Field label="Email">
              <input name="c_email" defaultValue={site.contact?.email} className={inputCls} />
            </Field>
            <Field label="Alternate email">
              <input name="c_alt_email" defaultValue={site.contact?.alt_email ?? ""} className={inputCls} />
            </Field>
            <Field label="Working hours">
              <input name="c_hours" defaultValue={site.contact?.hours} className={inputCls} />
            </Field>
            <div className="sm:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase text-faint">
                Contact people (Contact Us page)
              </span>
              <Repeater
                name="c_people"
                initial={site.contact?.people ?? []}
                fields={[
                  { key: "role", label: "Role" },
                  { key: "name", label: "Name" },
                ]}
                addLabel="Add person"
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-bold">Social links</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {SOCIALS.map((k) => (
              <Field key={k} label={k}>
                <input
                  name={`social_${k}`}
                  defaultValue={site.socials?.[k] ?? ""}
                  className={inputCls}
                  placeholder="https://"
                />
              </Field>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-1 font-bold">Home-visit pricing rule</h2>
          <p className="mb-4 text-xs text-faint">
            When a customer picks this product option, the product page shows the price below
            instead of the full product price (the home-visit fee is collected separately).
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Option label to match" hint="Exact text of the option value, e.g. “Tailor Home Visit”">
              <input name="hv_label" defaultValue={hv.option_label} className={inputCls} />
            </Field>
            <Field label="Price shown (₹)">
              <input name="hv_price" type="number" min={0} defaultValue={hv.display_price} className={inputCls} />
            </Field>
            <Field label="Note under the price" className="sm:col-span-2">
              <input name="hv_note" defaultValue={hv.note} className={inputCls} />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-bold">Default SEO</h2>
          <div className="space-y-4">
            <Field label="Default title">
              <input name="seo_title" defaultValue={seo.default_title} className={inputCls} />
            </Field>
            <Field label="Default description">
              <textarea name="seo_desc" defaultValue={seo.default_description} rows={2} className={inputCls} />
            </Field>
          </div>
        </Card>

        <div className="sticky bottom-4">
          <SubmitButton>Save all settings</SubmitButton>
        </div>
      </form>
    </div>
  );
}

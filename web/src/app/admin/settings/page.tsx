import { getSetting, getSiteConfig, DEFAULT_HOME_VISIT, DEFAULT_STORE, DEFAULT_PAGE_TEXT } from "@/lib/settings";
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
  const store = site.store ?? DEFAULT_STORE;
  const pt = { ...DEFAULT_PAGE_TEXT, ...(site.page_text ?? {}) };

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
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="“All categories” button">
                <input name="nav_all_categories_label" defaultValue={site.nav?.all_categories_label ?? "All Categories"} className={inputCls} />
              </Field>
              <Field label="Home link">
                <input name="nav_home_label" defaultValue={site.nav?.home_label ?? "Home"} className={inputCls} />
              </Field>
              <Field label="Collection menu">
                <input name="nav_collection_label" defaultValue={site.nav?.collection_label ?? "Collection"} className={inputCls} />
              </Field>
              <label className="flex items-center gap-2 text-sm sm:col-span-3">
                <input type="checkbox" name="nav_show_collection" defaultChecked={site.nav?.show_collection !== false} className="h-4 w-4" />
                Show the Collection mega-menu
              </label>
            </div>
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
          <h2 className="mb-1 font-bold">Shipping</h2>
          <p className="mb-4 text-xs text-faint">Used in the cart, at checkout and when the order is placed.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Shipping fee (₹)">
              <input name="shipping_fee" type="number" min={0} defaultValue={store.shipping_fee} className={inputCls} />
            </Field>
            <Field label="Free shipping on orders of (₹) or more">
              <input name="free_shipping_over" type="number" min={0} defaultValue={store.free_shipping_over} className={inputCls} />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="mb-1 font-bold">Page text</h2>
          <p className="mb-4 text-xs text-faint">Headings and intro copy on the Book Visit and Contact pages and in the footer.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Book Visit — title" className="sm:col-span-2">
              <input name="pt_book_visit_title" defaultValue={pt.book_visit_title} className={inputCls} />
            </Field>
            <Field label="Book Visit — intro" className="sm:col-span-2">
              <textarea name="pt_book_visit_intro" rows={3} defaultValue={pt.book_visit_intro} className={inputCls} />
            </Field>
            <Field label="Book Visit — sidebar heading">
              <input name="pt_book_visit_help_heading" defaultValue={pt.book_visit_help_heading} className={inputCls} />
            </Field>
            <Field label="Contact — address heading">
              <input name="pt_contact_address_heading" defaultValue={pt.contact_address_heading} className={inputCls} />
            </Field>
            <Field label="Contact — phone/email heading">
              <input name="pt_contact_quick_heading" defaultValue={pt.contact_quick_heading} className={inputCls} />
            </Field>
            <Field label="Contact — hours heading">
              <input name="pt_contact_hours_heading" defaultValue={pt.contact_hours_heading} className={inputCls} />
            </Field>
            <Field label="Contact — form heading">
              <input name="pt_contact_form_heading" defaultValue={pt.contact_form_heading} className={inputCls} />
            </Field>
            <Field label="Footer — newsletter sub-text">
              <input name="pt_newsletter_subtext" defaultValue={pt.newsletter_subtext} className={inputCls} />
            </Field>
            <Field label="Footer — gallery heading">
              <input name="pt_gallery_heading" defaultValue={pt.gallery_heading} className={inputCls} />
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

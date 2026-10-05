import { getSiteConfig } from "@/lib/settings";
import { PageHeader, Card, Field, inputCls, SubmitButton } from "@/components/admin/ui";
import { ImageField } from "@/components/admin/ImageField";
import { Repeater } from "@/components/admin/Repeater";
import { saveFooter } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminFooter() {
  const site = await getSiteConfig();
  const columns =
    site.footer_columns?.length
      ? site.footer_columns
      : [{ title: "Information", links: site.footer_information_links ?? [] }];

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Footer"
        subtitle="Newsletter bar, link columns, Instagram gallery, category strip and copyright"
      />
      <form action={saveFooter} className="space-y-6">
        <Card>
          <h2 className="mb-3 font-bold">WhatsApp channel banner</h2>
          <p className="mb-3 text-xs text-faint">
            The dark “Join Our WhatsApp Channel” bar shown above the newsletter signup. Paste your channel link
            (https://whatsapp.com/channel/…); if left empty the button opens a WhatsApp chat with your number.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="wc_enabled" defaultChecked={site.whatsapp_channel?.enabled !== false} className="h-4 w-4" />
              Show the banner
            </label>
            <Field label="Heading">
              <input name="wc_heading" defaultValue={site.whatsapp_channel?.heading ?? ""} placeholder="Join Our Whatsapp Channel" className={inputCls} />
            </Field>
            <Field label="Button label">
              <input name="wc_button" defaultValue={site.whatsapp_channel?.button ?? ""} placeholder="Follow Us" className={inputCls} />
            </Field>
            <Field label="Sub text" className="sm:col-span-2">
              <input name="wc_text" defaultValue={site.whatsapp_channel?.text ?? ""} placeholder="We will share you latest collection and update" className={inputCls} />
            </Field>
            <Field label="Channel link" className="sm:col-span-2">
              <input name="wc_url" defaultValue={site.whatsapp_channel?.url ?? ""} placeholder="https://whatsapp.com/channel/…" className={inputCls} />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-bold">Newsletter &amp; video</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Newsletter heading">
              <input name="newsletter_heading" defaultValue={site.newsletter_heading ?? ""} placeholder="Signup For Newsletter" className={inputCls} />
            </Field>
            <Field label="Footer video (YouTube link)" hint="Shown as a clickable thumbnail in the first column. Leave blank to show the logo.">
              <input name="footer_video" defaultValue={site.footer_video ?? ""} placeholder="https://www.youtube.com/watch?v=…" className={inputCls} />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="mb-1 font-bold">Link columns</h2>
          <p className="mb-3 text-xs text-faint">
            Each column has a heading and a list of links. Info pages you create under Admin → Info
            Pages live at <code>/your-page-slug</code>.
          </p>
          <Repeater
            name="columns"
            initial={columns}
            fields={[
              { key: "title", label: "Column heading" },
              {
                key: "links",
                label: "Links",
                type: "list",
                addLabel: "Add link",
                fields: [
                  { key: "text", label: "Text" },
                  { key: "href", label: "Link", placeholder: "/about-us" },
                ],
              },
            ]}
            addLabel="Add column"
          />
        </Card>

        <Card>
          <h2 className="mb-3 font-bold">Instagram gallery</h2>
          <Repeater
            name="gallery"
            initial={site.footer_gallery ?? []}
            fields={[
              { key: "image", label: "Image", type: "image" },
              { key: "href", label: "Link", placeholder: "https://www.instagram.com/…" },
            ]}
            addLabel="Add image"
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="“More” tile image">
              <ImageField name="more_image" defaultValue={site.footer_gallery_more?.image ?? ""} />
            </Field>
            <Field label="“More” tile link">
              <input name="more_href" defaultValue={site.footer_gallery_more?.href ?? ""} className={inputCls} />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-bold">Bottom category strip</h2>
          <Repeater
            name="tags"
            initial={site.footer_tags ?? []}
            fields={[
              { key: "text", label: "Text" },
              { key: "href", label: "Link", placeholder: "/suit-blazer/formal-suit" },
            ]}
            addLabel="Add link"
          />
        </Card>

        <Card>
          <Field label="Copyright line">
            <input name="copyright" defaultValue={site.copyright ?? ""} placeholder="Callmytailor © 2026 All Rights Reserved." className={inputCls} />
          </Field>
        </Card>

        <div className="sticky bottom-4">
          <SubmitButton>Save footer</SubmitButton>
        </div>
      </form>
    </div>
  );
}

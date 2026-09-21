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

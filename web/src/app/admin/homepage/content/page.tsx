import { getSiteConfig, DEFAULT_TRENDING } from "@/lib/settings";
import { PageHeader, Card, Field, inputCls, SubmitButton } from "@/components/admin/ui";
import { ImageField } from "@/components/admin/ImageField";
import { Repeater } from "@/components/admin/Repeater";
import { HomepageTabs } from "@/components/admin/HomepageTabs";
import {
  saveTitlesAndBackgrounds,
  saveHowItWorks,
  saveSpecializations,
  saveOrderByCategory,
  saveTrendingAndRails,
  saveWhyChooseUs,
  saveMadeCta,
  saveStats,
} from "../content-actions";

export const dynamic = "force-dynamic";

export default async function HomepageContent() {
  const site = await getSiteConfig();
  const T = site.titles ?? {};
  const BG = site.backgrounds ?? {};
  const rails = site.product_rails ?? [];

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Homepage"
        subtitle="Edit the text, images and links of every homepage section. Each block saves on its own."
      />
      <HomepageTabs />

      <Card>
        <form action={saveTitlesAndBackgrounds} className="space-y-4">
          <h2 className="font-bold">Section headings &amp; background images</h2>
          <p className="text-xs text-faint">Leave a heading blank to use the default.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="How it works">
              <input name="t_how_it_works" defaultValue={T.how_it_works ?? ""} placeholder="How It Work" className={inputCls} />
            </Field>
            <Field label="Our specialization">
              <input name="t_specialization" defaultValue={T.specialization ?? ""} placeholder="Our Specialization" className={inputCls} />
            </Field>
            <Field label="Order by category">
              <input name="t_order_by_category" defaultValue={T.order_by_category ?? ""} placeholder="Order by Category" className={inputCls} />
            </Field>
            <Field label="Why choose us">
              <input name="t_why_choose_us" defaultValue={T.why_choose_us ?? ""} placeholder="Why Choose Us" className={inputCls} />
            </Field>
            <Field label="Trending items">
              <input name="t_trending" defaultValue={T.trending ?? ""} placeholder="Trending Items" className={inputCls} />
            </Field>
            <Field label="Fabric brands">
              <input name="t_fabric_brands" defaultValue={T.fabric_brands ?? ""} placeholder="Our Fabric's Branded" className={inputCls} />
            </Field>
            <Field label="Testimonials">
              <input name="t_testimonials" defaultValue={T.testimonials ?? ""} placeholder="Testimonials" className={inputCls} />
            </Field>
            <Field label="Latest blog">
              <input name="t_blog" defaultValue={T.blog ?? ""} placeholder="Latest Blog" className={inputCls} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="“Why choose us” background">
              <ImageField name="bg_why_choose" defaultValue={BG.why_choose ?? ""} placeholder="/whychoose-bg.jpg (default)" />
            </Field>
            <Field label="“Made for you” background">
              <ImageField name="bg_made" defaultValue={BG.made ?? ""} placeholder="/made-bg.jpg (default)" />
            </Field>
            <Field label="Stats background">
              <ImageField name="bg_stats" defaultValue={BG.stats ?? ""} placeholder="/stats-bg.jpg (default)" />
            </Field>
            <Field label="Fabric brands banner">
              <ImageField name="bg_fabric" defaultValue={BG.fabric ?? ""} placeholder="/fabric-bg.jpg (default)" />
            </Field>
          </div>
          <SubmitButton>Save headings &amp; backgrounds</SubmitButton>
        </form>
      </Card>

      <Card>
        <form action={saveHowItWorks} className="space-y-3">
          <h2 className="font-bold">How it works — steps</h2>
          <p className="text-xs text-faint">
            Steps are numbered in order. Icon is optional — leave blank to use the built-in
            illustrations.
          </p>
          <Repeater
            name="how"
            initial={(site.how_it_works ?? []).map((s) => ({ title: s.title, text: s.text, icon: s.icon ?? "" }))}
            fields={[
              { key: "title", label: "Title" },
              { key: "text", label: "Sub text" },
              { key: "icon", label: "Icon (optional)", type: "image" },
            ]}
            addLabel="Add step"
          />
          <SubmitButton>Save steps</SubmitButton>
        </form>
      </Card>

      <Card>
        <form action={saveSpecializations} className="space-y-3">
          <h2 className="font-bold">Our specialization — tiles</h2>
          <p className="text-xs text-faint">
            The first four tiles are shown. Link is a category path such as <code>suit-blazer</code>.
            Leave the image blank to use a product photo from that category.
          </p>
          <Repeater
            name="items"
            initial={(site.specializations ?? []).map((s) => ({ title: s.title, slug: s.slug, image: s.image ?? "" }))}
            fields={[
              { key: "title", label: "Title" },
              { key: "slug", label: "Category path", placeholder: "wedding-attire" },
              { key: "image", label: "Image", type: "image" },
            ]}
            addLabel="Add tile"
          />
          <SubmitButton>Save specialization</SubmitButton>
        </form>
      </Card>

      <Card>
        <form action={saveOrderByCategory} className="space-y-3">
          <h2 className="font-bold">Order by category — cards</h2>
          <Repeater
            name="items"
            initial={(site.order_by_category ?? []).map((s) => ({ label: s.label, slug: s.slug, image: s.image ?? "" }))}
            fields={[
              { key: "label", label: "Label" },
              { key: "slug", label: "Category path", placeholder: "suit-blazer/formal-suit" },
              { key: "image", label: "Image", type: "image" },
            ]}
            addLabel="Add card"
          />
          <SubmitButton>Save categories</SubmitButton>
        </form>
      </Card>

      <Card>
        <form action={saveTrendingAndRails} className="space-y-4">
          <h2 className="font-bold">Product rails &amp; trending tabs</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Field key={i} label={`Rail tab ${i + 1}`} hint={["Shows best-seller products", "Shows new-arrival products", "Shows top-rated products"][i]}>
                <input
                  name={`rail_${i + 1}`}
                  defaultValue={rails[i] ?? ["Best Sellers", "New Arrivals", "Most Rating"][i]}
                  className={inputCls}
                />
              </Field>
            ))}
          </div>
          <div>
            <span className="mb-1 block text-xs font-bold uppercase text-faint">
              Trending items tabs
            </span>
            <Repeater
              name="trending"
              initial={site.trending_categories?.length ? site.trending_categories : DEFAULT_TRENDING}
              fields={[
                { key: "label", label: "Tab label" },
                { key: "slug", label: "Category slug", placeholder: "kurta" },
              ]}
              addLabel="Add tab"
            />
          </div>
          <SubmitButton>Save rails &amp; tabs</SubmitButton>
        </form>
      </Card>

      <Card>
        <form action={saveWhyChooseUs} className="space-y-3">
          <h2 className="font-bold">Why choose us — points</h2>
          <Repeater
            name="items"
            initial={(site.why_choose_us ?? []).map((w) => ({ icon: w.icon, title: w.title, text: w.text }))}
            fields={[
              { key: "icon", label: "Icon (round icon image)", type: "image" },
              { key: "title", label: "Title" },
              { key: "text", label: "Text" },
            ]}
            addLabel="Add point"
          />
          <SubmitButton>Save points</SubmitButton>
        </form>
      </Card>

      <Card>
        <form action={saveMadeCta} className="space-y-3">
          <h2 className="font-bold">“Made for you” call-to-action</h2>
          <p className="text-xs text-faint">Clear the heading to hide this block.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Heading" className="sm:col-span-2">
              <input name="title" defaultValue={site.made_cta?.title ?? ""} className={inputCls} />
            </Field>
            <Field label="Text" className="sm:col-span-2">
              <textarea name="text" rows={3} defaultValue={site.made_cta?.text ?? ""} className={inputCls} />
            </Field>
            <Field label="Button label">
              <input name="button" defaultValue={site.made_cta?.button ?? ""} className={inputCls} />
            </Field>
            <Field label="Button link">
              <input name="link" defaultValue={site.made_cta?.link ?? ""} className={inputCls} />
            </Field>
          </div>
          <SubmitButton>Save call-to-action</SubmitButton>
        </form>
      </Card>

      <Card>
        <form action={saveStats} className="space-y-3">
          <h2 className="font-bold">Stats counter</h2>
          <Repeater
            name="items"
            initial={(site.stats ?? []).map((s) => ({ value: s.value, label: s.label }))}
            fields={[
              { key: "value", label: "Value", placeholder: "5,485+" },
              { key: "label", label: "Label", placeholder: "Happy Clients" },
            ]}
            addLabel="Add stat"
          />
          <SubmitButton>Save stats</SubmitButton>
        </form>
      </Card>
    </div>
  );
}

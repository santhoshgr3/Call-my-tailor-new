import { getSetting, setSetting, getSiteConfig } from "@/lib/settings";
import { bustStorefrontCache } from "@/lib/cache";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { PageHeader, Card, Field, inputCls, SubmitButton } from "@/components/admin/ui";
import type { SiteConfig } from "@/lib/settings";

export const dynamic = "force-dynamic";

async function saveSettings(fd: FormData) {
  "use server";
  await requireAdmin();
  const site = await getSiteConfig();

  const parseJson = <T,>(key: string, fallback: T): T => {
    try {
      return JSON.parse(String(fd.get(key) || "")) as T;
    } catch {
      return fallback;
    }
  };
  const lines = (key: string) =>
    String(fd.get(key) || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

  const next: SiteConfig = {
    ...site,
    brand: String(fd.get("brand") || site.brand),
    tagline: String(fd.get("tagline") || site.tagline),
    booking_url: String(fd.get("booking_url") || site.booking_url),
    top_bar: lines("top_bar"),
    top_tags: lines("top_tags"),
    socials: parseJson("socials", site.socials),
    contact: {
      ...site.contact,
      address: String(fd.get("c_address") || ""),
      phone: String(fd.get("c_phone") || ""),
      phone_raw: String(fd.get("c_phone_raw") || ""),
      whatsapp: String(fd.get("c_whatsapp") || ""),
      email: String(fd.get("c_email") || ""),
      hours: String(fd.get("c_hours") || ""),
    },
    why_choose_us: parseJson("why_choose_us", site.why_choose_us),
    how_it_works: parseJson("how_it_works", site.how_it_works),
    stats: parseJson("stats", site.stats),
  };
  await setSetting("site", next);

  await setSetting("seo", {
    default_title: String(fd.get("seo_title") || ""),
    default_description: String(fd.get("seo_desc") || ""),
  });

  bustStorefrontCache();
  revalidatePath("/", "layout");
}

export default async function AdminSettings() {
  const site = await getSiteConfig();
  const seo = await getSetting<{ default_title: string; default_description: string }>("seo", {
    default_title: "",
    default_description: "",
  });

  return (
    <div className="max-w-3xl">
      <PageHeader title="Site Settings" subtitle="Global content shown across the storefront" />
      <form action={saveSettings} className="space-y-6">
        <Card>
          <h2 className="mb-3 font-bold">Brand</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Brand name">
              <input name="brand" defaultValue={site.brand} className={inputCls} />
            </Field>
            <Field label="Tagline">
              <input name="tagline" defaultValue={site.tagline} className={inputCls} />
            </Field>
            <Field label="Booking URL" className="sm:col-span-2">
              <input name="booking_url" defaultValue={site.booking_url} className={inputCls} />
            </Field>
            <Field label="Top bar messages (one per line)" className="sm:col-span-2">
              <textarea
                name="top_bar"
                defaultValue={(site.top_bar ?? []).join("\n")}
                rows={2}
                className={inputCls}
              />
            </Field>
            <Field label="Top tags (one per line)" className="sm:col-span-2">
              <textarea
                name="top_tags"
                defaultValue={(site.top_tags ?? []).join("\n")}
                rows={4}
                className={inputCls}
              />
            </Field>
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
            <Field label="Working hours" className="sm:col-span-2">
              <input name="c_hours" defaultValue={site.contact?.hours} className={inputCls} />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-bold">Social links (JSON)</h2>
          <textarea
            name="socials"
            defaultValue={JSON.stringify(site.socials ?? {}, null, 2)}
            rows={7}
            className={inputCls + " font-mono text-xs"}
          />
        </Card>

        <Card>
          <h2 className="mb-3 font-bold">“Why Choose Us” (JSON array of {`{icon,title,text}`})</h2>
          <textarea
            name="why_choose_us"
            defaultValue={JSON.stringify(site.why_choose_us ?? [], null, 2)}
            rows={10}
            className={inputCls + " font-mono text-xs"}
          />
        </Card>

        <Card>
          <h2 className="mb-3 font-bold">“How It Works” (JSON array of {`{step,title,text}`})</h2>
          <textarea
            name="how_it_works"
            defaultValue={JSON.stringify(site.how_it_works ?? [], null, 2)}
            rows={8}
            className={inputCls + " font-mono text-xs"}
          />
        </Card>

        <Card>
          <h2 className="mb-3 font-bold">Stats counter (JSON array of {`{value,label}`})</h2>
          <textarea
            name="stats"
            defaultValue={JSON.stringify(site.stats ?? [], null, 2)}
            rows={7}
            className={inputCls + " font-mono text-xs"}
          />
        </Card>

        <Card>
          <h2 className="mb-3 font-bold">Default SEO</h2>
          <div className="space-y-4">
            <Field label="Default title">
              <input name="seo_title" defaultValue={seo.default_title} className={inputCls} />
            </Field>
            <Field label="Default description">
              <textarea
                name="seo_desc"
                defaultValue={seo.default_description}
                rows={2}
                className={inputCls}
              />
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

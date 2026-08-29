import { unstable_cache } from "next/cache";
import { db } from "./db";

export type ContactInfo = {
  address: string;
  phone: string;
  phone_raw: string;
  whatsapp: string;
  email: string;
  alt_email?: string;
  hours: string;
  people: { role: string; name: string }[];
};

export type SiteConfig = {
  brand: string;
  tagline: string;
  top_bar: string[];
  socials: Record<string, string>;
  contact: ContactInfo;
  booking_url: string;
  top_tags: string[];
  specializations: { title: string; slug: string }[];
  order_by_category: { label: string; slug: string }[];
  payment_partners: string[];
  footer_information_links: { text: string; href: string }[];
  why_choose_us: { icon: string; title: string; text: string }[];
  how_it_works: { step: number; title: string; text: string }[];
  stats: { value: string; label: string }[];
  section_titles?: string[];
  product_rails?: string[];
  trending_tabs?: string[];
  made_cta?: {
    title: string;
    text: string;
    button: string;
    link: string;
  } | null;
};

/** Used when the DB is unreachable (e.g. during `next build` before the
 *  DATABASE_URL is wired up). Keeps the build green; real values load at runtime. */
export const FALLBACK_SITE: SiteConfig = {
  brand: "Call My Tailor",
  tagline: "For Custom Clothing",
  top_bar: ["Gurranteed Fitting", "Free Home Visit"],
  socials: {},
  contact: {
    address: "",
    phone: "+91 888-2222-900",
    phone_raw: "918882222900",
    whatsapp: "918882222900",
    email: "callmytailor@gmail.com",
    hours: "",
    people: [],
  },
  booking_url: "https://booking.callmytailor.com/",
  top_tags: [],
  specializations: [],
  order_by_category: [],
  payment_partners: [],
  footer_information_links: [],
  why_choose_us: [],
  how_it_works: [],
  stats: [],
};

const readSettingCached = unstable_cache(
  async (key: string): Promise<string | null> => {
    const row = await db.setting.findUnique({ where: { key } });
    return row?.value ?? null;
  },
  ["setting"],
  { revalidate: 300, tags: ["settings"] },
);

export async function getSetting<T = unknown>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await readSettingCached(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setSetting(key: string, value: unknown) {
  const json = JSON.stringify(value);
  await db.setting.upsert({
    where: { key },
    create: { key, value: json },
    update: { value: json },
  });
}

export async function getAllSettings(): Promise<Record<string, unknown>> {
  try {
    const rows = await db.setting.findMany();
    const out: Record<string, unknown> = {};
    for (const r of rows) {
      try {
        out[r.key] = JSON.parse(r.value);
      } catch {
        out[r.key] = r.value;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export async function getSiteConfig(): Promise<SiteConfig> {
  const cfg = await getSetting<SiteConfig | null>("site", null);
  return cfg ?? FALLBACK_SITE;
}

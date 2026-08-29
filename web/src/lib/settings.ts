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

const DEFAULTS: Record<string, unknown> = {};

export async function getSetting<T = unknown>(key: string, fallback: T): Promise<T> {
  const row = await db.setting.findUnique({ where: { key } });
  if (!row) return (DEFAULTS[key] as T) ?? fallback;
  try {
    return JSON.parse(row.value) as T;
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
}

export async function getSiteConfig(): Promise<SiteConfig> {
  return getSetting<SiteConfig>("site", {} as SiteConfig);
}

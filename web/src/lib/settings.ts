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
  specializations: { title: string; slug: string; image?: string }[];
  order_by_category: { label: string; slug: string; image?: string }[];
  payment_partners: string[];
  footer_information_links: { text: string; href: string }[];
  footer_columns?: { title: string; links: { text: string; href: string }[] }[];
  footer_video?: string | null;
  footer_gallery?: { image: string; href: string }[];
  footer_gallery_more?: { image: string; href: string } | null;
  footer_tags?: { text: string; href: string }[];
  newsletter_heading?: string;
  copyright?: string;
  why_choose_us: { icon: string; title: string; text: string }[];
  how_it_works: { step: number; title: string; text: string; icon?: string }[];
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
  logo?: string;
  backgrounds?: {
    why_choose?: string;
    made?: string;
    stats?: string;
    fabric?: string;
  };
  header_links?: { label: string; href: string }[];
  titles?: {
    how_it_works?: string;
    specialization?: string;
    order_by_category?: string;
    why_choose_us?: string;
    trending?: string;
    fabric_brands?: string;
    testimonials?: string;
    blog?: string;
  };
  trending_categories?: { label: string; slug: string }[];
  home_visit?: {
    option_label: string;
    display_price: number;
    note: string;
  };
  store?: {
    shipping_fee: number;
    free_shipping_over: number;
  };
  page_text?: {
    book_visit_title?: string;
    book_visit_intro?: string;
    book_visit_help_heading?: string;
    contact_address_heading?: string;
    contact_quick_heading?: string;
    contact_hours_heading?: string;
    contact_form_heading?: string;
    newsletter_subtext?: string;
    gallery_heading?: string;
  };
};

export const DEFAULT_STORE = { shipping_fee: 199, free_shipping_over: 4999 };

export const DEFAULT_PAGE_TEXT = {
  book_visit_title: "Book a Free Home Visit",
  book_visit_intro:
    "Why go anywhere? Our expert tailor visits your home or office at a convenient time, takes precise measurements and brings fabric swatches from 2000+ options. Fill the form and our team will confirm your slot.",
  book_visit_help_heading: "Need help now?",
  contact_address_heading: "Visit Our Store",
  contact_quick_heading: "24/7 Quick Contact",
  contact_hours_heading: "Working Hours",
  contact_form_heading: "Send us a message",
  newsletter_subtext: "We'll never share your email address with a third-party.",
  gallery_heading: "Instagram Gallery",
};

export const DEFAULT_HEADER_LINKS = [
  { label: "Book Home Visit", href: "/book-visit" },
  { label: "Blog", href: "/blog" },
];

export const DEFAULT_TRENDING = [
  { label: "All", slug: "catalogue" },
  { label: "Accessories", slug: "accessories" },
  { label: "Ethnic Wear", slug: "ethnic-wear" },
  { label: "Kurta", slug: "kurta" },
  { label: "Suit/Blazer", slug: "suit-blazer" },
];

export const DEFAULT_HOME_VISIT = {
  option_label: "Tailor Home Visit",
  display_price: 0,
  note: "₹300 will be paid for the home visit.",
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

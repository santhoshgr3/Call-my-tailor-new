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
  booking?: Partial<BookingConfig>;
  payments?: {
    cod_enabled?: boolean;
    online_enabled?: boolean;
  };
  nav?: {
    all_categories_label?: string;
    home_label?: string;
    collection_label?: string;
    show_collection?: boolean;
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

export const DEFAULT_NAV = {
  all_categories_label: "All Categories",
  home_label: "Home",
  collection_label: "Collection",
  show_collection: true,
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

/* ------------------------------------------------------------------ */
/* Home-visit booking page                                              */
/* ------------------------------------------------------------------ */

export type BookingCategory = {
  slug: string;
  label: string;
  desc: string;
  subtitle: string;
  image: string;
  banner: string;
};

export type BookingConfig = {
  eyebrow: string;
  title_line1: string;
  title_accent: string;
  subtitle: string;
  body: string;
  hero_image: string;
  cta_label: string;
  stats: { value: string; label: string }[];
  categories: BookingCategory[];
  steps: { title: string; sub: string; image: string }[];
  features: { icon: string; title: string; sub: string }[];
  select_heading: string;
  select_intro: string;
  visit_charge: number;
  payment_link: string;
  time_slots: string[];
  notice: string;
  form_title: string;
  form_eyebrow: string;
  empty_note: string;
  success_title: string;
  success_steps: string[];
};

export const DEFAULT_BOOKING: BookingConfig = {
  eyebrow: "Premium Home Tailoring Service",
  title_line1: "Book Your Personal",
  title_accent: "Tailor at Home",
  subtitle: "No travel. No hassle. Just perfectly tailored outfits made for you.",
  body: "Our expert tailors visit your home for measurements, fabric selection, and fittings—making custom clothing easier than ever.",
  hero_image: "/img/booking/hero-bg.jpeg",
  cta_label: "Book Home Visit",
  stats: [
    { value: "5,485+", label: "Happy Clients" },
    { value: "15 Yrs", label: "Experience" },
    { value: "250+", label: "Expert Tailors" },
    { value: "14,580+", label: "Garments Delivered" },
  ],
  categories: [
    {
      slug: "mens",
      label: "Men's Tailoring",
      desc: "Coat Pant, Kurta Pajama, Pant Shirt and all formal and Party Wear",
      subtitle: "Suits · Sherwanis · Kurta Sets & More",
      image: "/img/booking/home-mens.jpg",
      banner: "/img/booking/banner-mens.jpg",
    },
    {
      slug: "womens",
      label: "Women's Tailoring",
      desc: "Salwar Suits, Gowns, Anarkali, Lehengas, Western & Traditional Wear",
      subtitle: "Salwar · Lehenga · Kurti & More",
      image: "/img/booking/home-womens.jpg",
      banner: "/img/booking/banner-womens.jpg",
    },
    {
      slug: "alteration",
      label: "Alteration & Repair",
      desc: "Length adjustments, waist and shoulder fitting, sleeve corrections, and all kind of alterations.",
      subtitle: "Hemming · Fitting · Repairs & More",
      image: "/img/booking/home-alteration.jpg",
      banner: "/img/booking/banner-alteration.jpg",
    },
  ],
  steps: [
    { title: "Select your product", sub: "Or Upload Your Design", image: "/img/booking/process1.png" },
    { title: "Book your home visit", sub: "And Place Your Order", image: "/img/booking/process2.png" },
    { title: "Get measured at home", sub: "And Choose Your Fabrics", image: "/img/booking/process3.png" },
    { title: "Get delivered at home", sub: "After Getting Trial", image: "/img/booking/process4.png" },
  ],
  features: [
    { icon: "🧵", title: "2000+ Fabrics", sub: "For every occasion" },
    { icon: "✂️", title: "Expert Tailors", sub: "30+ years experience" },
    { icon: "🎨", title: "Fully Custom", sub: "Designed by you" },
    { icon: "🧶", title: "Fine Stitching", sub: "Latest techniques" },
    { icon: "📦", title: "7-Day Delivery", sub: "Guaranteed on-time" },
    { icon: "🏠", title: "Home Visit", sub: "No travel needed" },
  ],
  select_heading: "What are you looking for?",
  select_intro: "Choose the tailoring service that suits your style and needs.",
  visit_charge: 200,
  payment_link: "https://rzp.io/rzp/xejyQeF",
  time_slots: [
    "09:00 AM – 11:00 AM",
    "11:00 AM – 01:00 PM",
    "02:00 PM – 04:00 PM",
    "04:00 PM – 06:00 PM",
    "06:00 PM – 08:00 PM",
  ],
  notice:
    "A {charge} home visit charge will be applied at the time of booking. This amount will be adjusted in your final bill.",
  form_eyebrow: "Schedule Your Appointment",
  form_title: "Book a Home Visit",
  empty_note:
    "Our tailor will visit your home and help you choose fabrics & styles on the spot. No need to pre-select items!",
  success_title: "Booking Confirmed!",
  success_steps: [
    "Payment received successfully",
    "Tailor assigned within 2 hours",
    "Visit on your scheduled date",
    "Delivery in 7–10 business days",
  ],
};

/** Saved booking-page settings merged over the defaults. */
export function resolveBooking(site: { booking?: Partial<BookingConfig> } | null | undefined): BookingConfig {
  const b = site?.booking ?? {};
  const out = { ...DEFAULT_BOOKING } as Record<string, unknown>;
  for (const [k, v] of Object.entries(b)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v) && v.length === 0 && k !== "success_steps") continue;
    if (typeof v === "string" && v === "" && !["payment_link"].includes(k)) continue;
    out[k] = v;
  }
  return out as BookingConfig;
}

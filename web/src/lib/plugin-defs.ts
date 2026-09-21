/** Built-in plugins. Pure data — safe to import from server and client code. */

export type PluginField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "toggle" | "select" | "color" | "image" | "code";
  placeholder?: string;
  hint?: string;
  options?: { value: string; label: string }[];
  default?: string | number | boolean;
};

export type PluginDef = {
  id: string;
  name: string;
  description: string;
  icon: string;
  group: "Marketing" | "Engagement" | "Tracking & SEO" | "Store" | "Developer";
  defaultEnabled: boolean;
  fields: PluginField[];
};

export type PluginValue = string | number | boolean;
export type PluginState = Record<string, { enabled?: boolean; config?: Record<string, PluginValue> }>;

export const PLUGINS: PluginDef[] = [
  {
    id: "announcement-bar",
    name: "Announcement bar",
    description: "A slim message strip above the header — offers, delivery notices, festival greetings.",
    icon: "📣",
    group: "Marketing",
    defaultEnabled: false,
    fields: [
      { key: "message", label: "Message", type: "text", default: "Free home visit — book your slot today!" },
      { key: "link_label", label: "Link text", type: "text", placeholder: "Book now" },
      { key: "link", label: "Link", type: "text", placeholder: "/book-visit" },
      { key: "bg", label: "Background colour", type: "color", default: "#10131d" },
      { key: "fg", label: "Text colour", type: "color", default: "#ffffff" },
      { key: "dismissible", label: "Let visitors close it", type: "toggle", default: true },
    ],
  },
  {
    id: "promo-popup",
    name: "Promo popup",
    description: "A popup with an offer and an optional email sign-up. Shown once per visitor for as long as you choose.",
    icon: "🎁",
    group: "Marketing",
    defaultEnabled: false,
    fields: [
      { key: "title", label: "Title", type: "text", default: "Get 10% off your first order" },
      { key: "text", label: "Text", type: "textarea", default: "Join our list and we will send you the offer." },
      { key: "image", label: "Image (optional)", type: "image" },
      { key: "collect_email", label: "Ask for an email address", type: "toggle", default: true },
      { key: "button_label", label: "Button text", type: "text", default: "Sign me up" },
      { key: "button_link", label: "Button link (when not asking for email)", type: "text", placeholder: "/suit-blazer" },
      { key: "delay", label: "Show after (seconds)", type: "number", default: 6 },
      { key: "repeat_days", label: "Show again after (days)", type: "number", default: 7, hint: "0 = show on every visit" },
    ],
  },
  {
    id: "whatsapp-chat",
    name: "WhatsApp chat button",
    description: "The floating WhatsApp button. Set a different number, a pre-filled message and which side it sits on.",
    icon: "💬",
    group: "Engagement",
    defaultEnabled: true,
    fields: [
      { key: "number", label: "WhatsApp number", type: "text", placeholder: "Leave blank to use the contact number", hint: "Digits with country code, e.g. 918882222900" },
      { key: "message", label: "Pre-filled message", type: "text", default: "Hi, I would like to know more about your tailoring service." },
      {
        key: "position",
        label: "Side of the screen",
        type: "select",
        default: "right",
        options: [
          { value: "right", label: "Right" },
          { value: "left", label: "Left" },
        ],
      },
    ],
  },
  {
    id: "cookie-notice",
    name: "Cookie notice",
    description: "A small consent banner at the bottom of the page. Visitors accept once and it stays hidden.",
    icon: "🍪",
    group: "Engagement",
    defaultEnabled: false,
    fields: [
      { key: "message", label: "Message", type: "textarea", default: "We use cookies to make this site work better and to understand how it is used." },
      { key: "button_label", label: "Button text", type: "text", default: "Accept" },
      { key: "link_label", label: "Link text", type: "text", default: "Privacy policy" },
      { key: "link", label: "Link", type: "text", default: "/privacy-policy" },
    ],
  },
  {
    id: "mobile-bottom-bar",
    name: "Mobile bottom bar",
    description: "An app-style tab bar fixed to the bottom of phone screens: Home, Search, Orders and Account.",
    icon: "📱",
    group: "Store",
    defaultEnabled: false,
    fields: [
      { key: "home_label", label: "Home label", type: "text", default: "Home" },
      { key: "search_label", label: "Search label", type: "text", default: "Search" },
      { key: "cart_label", label: "Cart label", type: "text", default: "Order list" },
      { key: "account_label", label: "Account label", type: "text", default: "My account" },
    ],
  },
  {
    id: "back-to-top",
    name: "Back-to-top button",
    description: "A round button that appears after scrolling and takes visitors back to the top.",
    icon: "⬆️",
    group: "Engagement",
    defaultEnabled: false,
    fields: [
      {
        key: "position",
        label: "Side of the screen",
        type: "select",
        default: "left",
        options: [
          { value: "left", label: "Left" },
          { value: "right", label: "Right (above WhatsApp)" },
        ],
      },
    ],
  },
  {
    id: "analytics",
    name: "Analytics & tracking",
    description: "Connect Google Analytics 4, Google Tag Manager, Meta (Facebook) Pixel and Search Console just by pasting the IDs.",
    icon: "📊",
    group: "Tracking & SEO",
    defaultEnabled: false,
    fields: [
      { key: "ga4_id", label: "Google Analytics 4 ID", type: "text", placeholder: "G-XXXXXXXXXX" },
      { key: "gtm_id", label: "Google Tag Manager ID", type: "text", placeholder: "GTM-XXXXXXX" },
      { key: "meta_pixel_id", label: "Meta Pixel ID", type: "text", placeholder: "1234567890" },
      { key: "gsc_verification", label: "Search Console verification code", type: "text", placeholder: "content value of the meta tag" },
    ],
  },
  {
    id: "structured-data",
    name: "SEO structured data",
    description: "Adds Google-readable business and product data (JSON-LD) so search results can show prices, stars and your address.",
    icon: "🔎",
    group: "Tracking & SEO",
    defaultEnabled: true,
    fields: [
      { key: "price_range", label: "Price range", type: "text", default: "₹₹", hint: "Shown in the business listing, e.g. ₹₹ or ₹₹₹" },
      { key: "product_schema", label: "Add product data on product pages", type: "toggle", default: true },
    ],
  },
  {
    id: "custom-code",
    name: "Custom code",
    description: "Paste any third-party widget or script (live chat, heatmaps, schedulers) and your own CSS — no developer needed.",
    icon: "🧩",
    group: "Developer",
    defaultEnabled: false,
    fields: [
      { key: "head_html", label: "Code for the page head", type: "code", hint: "Added once when a page loads. Scripts are allowed." },
      { key: "body_html", label: "Code for the end of the page", type: "code", hint: "Chat widgets and similar go here." },
      { key: "css", label: "Custom CSS", type: "code", placeholder: ".btn-brand { border-radius: 999px; }" },
    ],
  },
  {
    id: "maintenance-mode",
    name: "Maintenance mode",
    description: "Shows a “we’ll be back soon” page to visitors while you work. Logged-in admins still see the real site.",
    icon: "🚧",
    group: "Developer",
    defaultEnabled: false,
    fields: [
      { key: "title", label: "Heading", type: "text", default: "We’ll be back soon" },
      { key: "message", label: "Message", type: "textarea", default: "Our website is being updated. Please check back shortly or call us to book a home visit." },
    ],
  },
];

export const PLUGIN_GROUPS: PluginDef["group"][] = [
  "Marketing",
  "Engagement",
  "Store",
  "Tracking & SEO",
  "Developer",
];

export function getPluginDef(id: string): PluginDef | undefined {
  return PLUGINS.find((p) => p.id === id);
}

/** Merge stored state with the plugin's defaults. */
export function resolvePlugin(def: PluginDef, state: PluginState) {
  const s = state[def.id] ?? {};
  const config: Record<string, PluginValue> = {};
  for (const f of def.fields) {
    const v = s.config?.[f.key];
    config[f.key] = v !== undefined ? v : f.default !== undefined ? f.default : f.type === "toggle" ? false : "";
  }
  return { id: def.id, enabled: s.enabled ?? def.defaultEnabled, config };
}

export function resolveAll(state: PluginState) {
  const out: Record<string, { enabled: boolean; config: Record<string, PluginValue> }> = {};
  for (const d of PLUGINS) out[d.id] = resolvePlugin(d, state);
  return out;
}

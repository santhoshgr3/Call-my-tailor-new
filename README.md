# Call My Tailor — rebuild + admin panel

A pixel-close rebuild of **callmytailor.com** (a Delhi doorstep-tailoring e‑commerce
store, originally on OpenCart) as a modern **Next.js 16 + Prisma** application, with a
full **admin panel** to manage every part of the site.

The catalog, copy, images, blog posts, testimonials and info pages were scraped from
the live site and seeded into the database.

```
CMT/
├── scraper/        # one-off Node scrapers + the scraped data (JSON) + image map
│   └── data/       # categories.json, products.json, blog.json, pages.json, home.json, site.json …
└── web/            # the Next.js application (storefront + admin + API)
```

---

## 1. Requirements

* Node.js 20.9+ (tested on v26)
* npm

No Docker or local database needed — dev uses a bundled **SQLite** file.

## 2. Run it locally

```bash
cd web
npm install
cp .env.example .env          # already present; edit AUTH_SECRET for anything real
npm run db:push               # create the SQLite schema (web/prisma/dev.db)
npm run db:seed               # load scraped catalog + demo data
npm run dev                   # http://localhost:3000
```

Storefront: <http://localhost:3000>
Admin panel: <http://localhost:3000/admin>

### Demo accounts

| Role     | Email                        | Password      |
|----------|------------------------------|---------------|
| Admin    | `admin@callmytailor.local`   | `admin123`    |
| Customer | `customer@example.com`       | `password123` |

> Change these in `web/prisma/seed.ts` before using anywhere real.

### Useful scripts

| Command             | What it does                                          |
|---------------------|------------------------------------------------------|
| `npm run dev`       | Start the dev server (Turbopack)                     |
| `npm run build`     | Production build                                     |
| `npm run db:seed`   | Re-seed the database from `../scraper/data`          |
| `npm run db:reset`  | Drop everything and re-seed                          |
| `npm run db:studio` | Open Prisma Studio to browse the DB                  |
| `npm run optimize:images` | Re-encode oversized images in `public/img` (needs `sharp`) |

---

## 3. What's included

### Storefront (`/`)

* Home — hero slider, promo banners, "How it works", specialization grid, category
  circles, Best Sellers / New Arrivals / Most Rating tabs, "Why choose us",
  trending-items tabs, "Made for you" CTA, fabric-brand strip, testimonials,
  animated stats counter, latest blog.
* Category listing — `/[category]` and `/[category]/[subcategory]`, with sidebar
  sub-categories, price filter, sort, page-size, pagination ("Showing X to Y of Z").
* Product detail — image gallery, price / ex-tax / SKU / availability, option
  selectors (Customization Method, Size) **with live price deltas**, quantity,
  add-to-cart, buy-now, "Book visit & order", Description tab with the
  item-specifics table, **Reviews tab with a submit form** (goes to moderation),
  related products.
* Blog index + article pages.
* Info pages — About, FAQ, Price List, Privacy, Terms, Refund, How it works, etc.
  (all scraped; editable in the admin).
* Search — `/search?q=` with optional category narrowing.
* Cart (drawer + full page), Checkout (guest or logged-in, coupon support,
  **COD or online Razorpay payment** with server-side signature verification),
  order confirmation.
* **Track My Order** — `/track-my-order`, look up any order by number + email/phone,
  with a status timeline.
* Accounts — register / login / logout, **editable profile + change password**,
  **full address book** (add / edit / delete / set-default), order history +
  order detail.
* Book a Home Visit form, Contact Us form, newsletter signup — all persisted.
* Floating WhatsApp button, brand-accurate red (`#EB3740`) / dark (`#10131D`) theme,
  Arial/Helvetica type.

### Admin panel (`/admin`, admin login required)

* **Dashboard** — KPIs, alert tiles, recent orders + recent home-visit requests.
* **Products** — searchable/filterable list, full create/edit form: images
  (upload or URL, reorder, remove), item-specifics, options + option values with
  price deltas, category assignment, visibility flags (active / featured /
  best-seller / new / trending), ratings, SEO. Quick active-toggle and delete.
* **Categories** — tree list, create/edit (parent, slug, image, menu visibility,
  sort order, SEO), delete.
* **Orders** — filter by status, detail view with line items, status &
  payment-status updates, internal notes.
* **Home Visits** — every booking with status workflow (new → contacted →
  scheduled → completed).
* **Customers** — list with lifetime value, detail with addresses + order history.
* **Reviews** — moderation queue (approve / delete), approved list.
* **Coupons** — CRUD (percent / fixed, min-subtotal, usage limit).
* **Homepage** — hero slides, promo banners, fabric brands CRUD + per-section
  visibility toggles.
* **Blog** — CRUD with HTML editor.
* **Testimonials** — CRUD.
* **Info Pages** — create + HTML edit + publish toggle.
* **Site Settings** — brand, contact block, socials, top bar, top tags,
  "Why choose us", "How it works", stats, default SEO.
* **Contact Messages** & **Newsletter** — inbox + CSV export.

---

## 4. Architecture notes

* **Next.js 16** App Router (Turbopack), React 19, Tailwind v4.
  Storefront routes live under `src/app/(store)/` so `/admin` has its own chrome.
* **Auth** — email + bcrypt, JWT session in an httpOnly cookie (`jose`).
  `getCurrentUser()` / `requireUser()` / `requireAdmin()` in `src/lib/auth.ts`.
* **Data** — Prisma. All mutations are **server actions** or route handlers with
  Zod validation (`src/lib/validation.ts`).
* **Cart** — client context + `localStorage`; the server re-prices every line
  against the DB at checkout (`src/lib/orders.ts`).
* **Images** — scraped originals live in `web/public/img/` (~130 MB after
  `npm run optimize:images`). Admin uploads go to `web/public/img/uploads/`.
  `next/image` runs unoptimized. ~105 of 580 products have no photo on the source
  site and fall back to `/img/placeholder.svg`, matching the original.
* **Payments** — full Razorpay flow (`/api/checkout` creates the Razorpay order,
  the browser opens Razorpay Checkout, `/api/payment/verify` verifies the HMAC
  signature and marks the order paid). It stays disabled and the checkout radio is
  greyed out until you set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` /
  `NEXT_PUBLIC_RAZORPAY_KEY_ID` in `.env`. Default checkout is Cash / pay-after-trial.
* **Option pricing** — option values carry a `priceDelta` (editable per value in the
  admin product form). The product page shows the adjusted "Your price" live, and
  `priceCart()` recomputes `base + Σ deltas` server-side so the client can't tamper
  with it.

### Moving to Supabase (Postgres) later

The schema is plain Prisma. To run on Supabase:

1. `web/prisma/schema.prisma` → change `datasource db { provider = "postgresql" }`.
2. Set `DATABASE_URL` to the Supabase connection string (use the pooured `6543`
   URL for the app, direct `5432` for migrations).
3. `npx prisma migrate deploy` (or `db push`), then `npm run db:seed`.
4. Optionally swap the local upload handler in
   `src/app/api/admin/upload/route.ts` for Supabase Storage.

No application code changes are required for the database swap.

---

## 5. Re-scraping (optional)

The scraped data is already committed under `scraper/data/`. To refresh it:

```bash
cd scraper
npm install
node scrape.mjs all          # categories, products, blog, pages, home, footer
node finalize.mjs            # builds site.json + patches home.json
node download-images.mjs     # downloads images into web/public/img + image-map.json
cd ../web && npm run db:reset
```

The live site sits behind a WAF that blocks plain requests and rate-limits after a
few hundred hits, so image downloads may need a second pass.

---

## 6. Known limitations

* Database is local **SQLite** — see "Moving to Supabase" above for the one-line
  switch to Postgres.
* Wishlist / product-compare from the original OpenCart theme are not reimplemented
  (not core to how the business operates).
* This is a development rebuild for demonstration; it reuses Call My Tailor's
  branding and content and is not affiliated with them.

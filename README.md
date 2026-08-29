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
* A **PostgreSQL** database (used for both local dev and production). Free options:
  [Neon](https://neon.tech), [Supabase](https://supabase.com),
  [Vercel Postgres](https://vercel.com/storage/postgres). Takes ~2 minutes to create.

## 2. Run it locally

```bash
cd web
npm install
cp .env.example .env
#  -> edit web/.env:
#     DATABASE_URL = your Postgres connection string
#     AUTH_SECRET  = any long random string
npm run db:deploy             # prisma db push + seed the scraped catalog & demo data
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
| `npm run build`     | `prisma generate` + production build                 |
| `npm run db:deploy` | `prisma db push` + seed (first-time / fresh DB)      |
| `npm run db:seed`   | Re-seed the database from `../scraper/data`          |
| `npm run db:reset`  | Drop everything and re-seed                          |
| `npm run db:studio` | Open Prisma Studio to browse the DB                  |
| `npm run optimize:images` | Re-encode oversized images in `public/img` (needs `sharp`) |

---

## 2b. Deploy to Vercel

The repo builds on Vercel out of the box. Once:

1. **Import the repo** into Vercel. Set the **Root Directory** to `web`.
2. Add **Environment Variables** (Project → Settings → Environment Variables):
   * `DATABASE_URL` — your Postgres connection string
     (Supabase: use the *Session pooler* / `:5432` URI, not transaction `:6543`).
   * `AUTH_SECRET` — any long random string.
   * `NEXT_PUBLIC_SITE_URL` — your deployed URL, e.g. `https://your-app.vercel.app`.
   * *(optional)* `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
3. **Deploy.** The build runs `prisma generate` automatically; it does **not** touch
   the database, so it succeeds even before the DB has any tables.
4. **Create the schema + seed data** once — from your machine, with the same
   `DATABASE_URL` in `web/.env`:
   ```bash
   cd web && npm run db:deploy
   ```
   (or run `npx prisma db push` then `npm run db:seed`).
5. Redeploy / open the site — the storefront and `/admin` now have data.

> Uploaded images (admin "Upload" button) are written to the app's filesystem,
> which is ephemeral on Vercel. For persistent uploads, point
> `src/app/api/admin/upload/route.ts` at Supabase Storage / S3 / Vercel Blob.
> Image **URLs** you paste into the admin (incl. the ~130 MB of catalog images
> committed under `public/img/`) work fine.

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
* **Data** — Prisma + **PostgreSQL**. All mutations are **server actions** or route
  handlers with Zod validation (`src/lib/validation.ts`). Every route is
  `dynamic = "force-dynamic"` (set on the layouts) — nothing is prerendered against
  the DB, so `next build` never needs a database connection.
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

* Admin image **uploads** hit the local filesystem — ephemeral on serverless hosts
  like Vercel. Pasting image URLs works; for uploaded files, wire
  `src/app/api/admin/upload/route.ts` to Vercel Blob / S3 / Supabase Storage.
* Wishlist / product-compare from the original OpenCart theme are not reimplemented
  (not core to how the business operates).
* This is a development rebuild for demonstration; it reuses Call My Tailor's
  branding and content and is not affiliated with them.

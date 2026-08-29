/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const DATA = resolve(process.cwd(), "../scraper/data");
const read = (f: string) => JSON.parse(readFileSync(resolve(DATA, f), "utf8"));

const imageMap: Record<string, string> = (() => {
  try {
    return read("image-map.json");
  } catch {
    return {};
  }
})();

const PLACEHOLDER = "/img/placeholder.svg";
function localImg(url?: string | null): string {
  if (!url) return PLACEHOLDER;
  if (url.startsWith("/img/")) return url;
  return imageMap[url] || PLACEHOLDER;
}
function rewriteHtmlImages(html: string): string {
  if (!html) return "";
  let out = html;
  for (const [remote, local] of Object.entries(imageMap)) {
    out = out.split(remote).join(local);
  }
  // strip scripts / style / opencart artefacts
  out = out.replace(/<script[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<style[\s\S]*?<\/style>/gi, "");
  out = out.replace(/ on\w+="[^"]*"/gi, "");
  return out.trim();
}

const usedSlugs = new Set<string>();
function slugify(s: string): string {
  const base =
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 70) || "item";
  let slug = base;
  let i = 2;
  while (usedSlugs.has(slug)) slug = `${base}-${i++}`;
  usedSlugs.add(slug);
  return slug;
}

async function main() {
  console.log("Wiping tables…");
  await db.$transaction([
    db.orderItem.deleteMany(),
    db.order.deleteMany(),
    db.address.deleteMany(),
    db.review.deleteMany(),
    db.productOptionValue.deleteMany(),
    db.productOption.deleteMany(),
    db.productSpec.deleteMany(),
    db.productImage.deleteMany(),
    db.productCategory.deleteMany(),
    db.product.deleteMany(),
    db.category.deleteMany(),
    db.customer.deleteMany(),
    db.coupon.deleteMany(),
    db.testimonial.deleteMany(),
    db.blogPost.deleteMany(),
    db.infoPage.deleteMany(),
    db.heroSlide.deleteMany(),
    db.promoBanner.deleteMany(),
    db.fabricBrand.deleteMany(),
    db.setting.deleteMany(),
    db.homeVisitBooking.deleteMany(),
    db.newsletterSubscriber.deleteMany(),
    db.contactMessage.deleteMany(),
  ]);

  // ---------------- Categories ----------------
  const cats: any[] = read("categories.json");
  const catIdBySlug: Record<string, string> = {};
  // parents first
  const ordered = [...cats.filter((c) => !c.parent), ...cats.filter((c) => c.parent)];
  let cSort = 0;
  for (const c of ordered) {
    usedSlugs.add(c.slug);
    const row = await db.category.create({
      data: {
        slug: c.slug,
        name: c.name,
        parentId: c.parent ? catIdBySlug[c.parent] ?? null : null,
        image: null,
        sortOrder: cSort++,
        showInMenu: c.slug !== "catalogue",
        metaTitle: `${c.name} | Call My Tailor`,
        metaDescription: `Custom tailored ${c.name} stitched at your doorstep by Call My Tailor.`,
      },
    });
    catIdBySlug[c.slug] = row.id;
  }
  console.log(`Categories: ${Object.keys(catIdBySlug).length}`);

  // ---------------- Products ----------------
  const products: any[] = read("products.json");
  const byLegacy = new Map(products.map((p) => [String(p.id), p]));
  const legacyNums = products
    .map((p) => Number(p.id))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => b - a);
  const newArrivalIds = new Set(legacyNums.slice(0, 14).map(String));

  let idx = 0;
  for (const p of products) {
    idx++;
    const price = Number(p.price) || Number(String(p.price_text || "").replace(/[^\d]/g, "")) || 0;
    const slug = slugify(p.name || `product-${p.id}`);
    const catSlugs: string[] = Array.from(new Set(p.categories || [])).filter(
      (s: any) => catIdBySlug[s],
    ) as string[];
    if (catSlugs.length === 0) catSlugs.push("catalogue");

    const images: string[] = Array.from(
      new Set((p.images || []).map((u: string) => localImg(u)).filter((u: string) => u !== PLACEHOLDER)),
    ) as string[];
    if (images.length === 0) images.push(localImg(p.image));

    const isNew = newArrivalIds.has(String(p.id));
    const isBest = idx % 6 === 0;
    const isTrend = idx % 5 === 2 && idx < 120;
    const isFeat = idx % 8 === 3;

    const descText: string = p.description || p.description_full || "";
    const specs: Record<string, string> = p.specs || {};

    await db.product.create({
      data: {
        slug,
        name: p.name,
        sku: p.model || null,
        legacyId: String(p.id),
        price,
        oldPrice: p.price_old ? Number(p.price_old) : null,
        shortDescription: descText.slice(0, 180),
        description: descText,
        descriptionHtml: descText ? `<p>${descText.replace(/\n+/g, "</p><p>")}</p>` : "",
        stockStatus: p.stock || "In Stock",
        hasImage: images.some((u) => u !== PLACEHOLDER),
        isActive: true,
        isNewArrival: isNew,
        isBestSeller: isBest,
        isTrending: isTrend,
        isFeatured: isFeat,
        rating: isBest || isTrend ? 5 : 0,
        ratingCount: isBest ? 3 : 0,
        soldCount: isBest ? 10 : 0,
        metaTitle: p.meta_title || `${p.name} | Call My Tailor`,
        metaDescription: (p.meta_description || descText).slice(0, 300),
        categories: {
          create: catSlugs.map((s) => ({ categoryId: catIdBySlug[s] })),
        },
        images: {
          create: images.map((url, i) => ({ url, alt: p.name, sortOrder: i })),
        },
        specs: {
          create: Object.entries(specs).map(([key, value], i) => ({
            key,
            value: String(value),
            sortOrder: i,
          })),
        },
        options: {
          create: [
            {
              label: "Customization Method",
              type: "select",
              required: true,
              sortOrder: 0,
              values: {
                create: [
                  { label: "Tailor Home Visit", sortOrder: 0 },
                  { label: "Customization on Call", sortOrder: 1 },
                  { label: "Ready to Ship (Standard Size)", sortOrder: 2 },
                ],
              },
            },
            {
              label: "Your Size ( Check Size Chart below )",
              type: "select",
              required: true,
              sortOrder: 1,
              values: {
                create: [
                  { label: "Custom (measured at home)", sortOrder: 0 },
                  ...["36", "38", "40", "42", "44", "46", "48"].map((s, i) => ({
                    label: s,
                    sortOrder: i + 1,
                  })),
                ],
              },
            },
          ],
        },
      },
    });
    if (idx % 100 === 0) console.log(`  products ${idx}/${products.length}`);
  }
  console.log(`Products: ${products.length}`);
  void byLegacy;

  // ---------------- Customers ----------------
  const adminPass = await bcrypt.hash("admin123", 10);
  const custPass = await bcrypt.hash("password123", 10);
  await db.customer.create({
    data: {
      email: "admin@callmytailor.local",
      passwordHash: adminPass,
      firstName: "Store",
      lastName: "Admin",
      phone: "+91 888-2222-900",
      role: "admin",
    },
  });
  const cust = await db.customer.create({
    data: {
      email: "customer@example.com",
      passwordHash: custPass,
      firstName: "Rahul",
      lastName: "Verma",
      phone: "+91 90000 00000",
      role: "customer",
      addresses: {
        create: [
          {
            fullName: "Rahul Verma",
            phone: "+91 90000 00000",
            line1: "12 Green Park",
            line2: "Near Metro Station",
            city: "New Delhi",
            state: "Delhi",
            pincode: "110016",
            isDefault: true,
          },
        ],
      },
    },
  });
  void cust;

  await db.coupon.create({
    data: { code: "WELCOME10", type: "percent", value: 10, minSubtotal: 3000, isActive: true },
  });

  // ---------------- Testimonials ----------------
  const home: any = read("home.json");
  const t: any[] = home.testimonials || [];
  await db.testimonial.createMany({
    data: t.map((x, i) => ({
      name: x.name || "Happy Customer",
      role: x.role || null,
      text: x.text || "",
      fbUrl: x.fb || null,
      rating: 5,
      sortOrder: i,
      isActive: true,
    })),
  });
  console.log(`Testimonials: ${t.length}`);

  // ---------------- Hero slides ----------------
  const slides: any[] = home.slides || [];
  for (const [i, s] of slides.entries()) {
    await db.heroSlide.create({
      data: {
        imageUrl: localImg(s.src),
        headline: s.alt || null,
        link: s.link || home?.made_cta?.link || "/book-visit",
        sortOrder: i,
      },
    });
  }

  // ---------------- Promo banners ----------------
  const promos: any[] = home.promo_banners || [];
  for (const [i, b] of promos.entries()) {
    await db.promoBanner.create({
      data: {
        imageUrl: localImg(b.src),
        title: b.title || b.alt || null,
        subtitle: b.subtitle || null,
        buttonLabel: b.button || "SHOP NOW",
        link: b.link || "/catalogue",
        position: "home-top",
        sortOrder: i,
      },
    });
  }

  // ---------------- Fabric brands ----------------
  const brands: string[] = home.fabric_brands || [];
  for (const [i, b] of brands.entries()) {
    await db.fabricBrand.create({
      data: { name: `Brand ${i + 1}`, logoUrl: localImg(b), sortOrder: i },
    });
  }
  console.log(`Fabric brands: ${brands.length}`);

  // ---------------- Blog ----------------
  const blog: any[] = read("blog.json");
  for (const [i, b] of blog.entries()) {
    const slug = String(b.slug || b.url || `post-${i}`).split("/").filter(Boolean).pop()!;
    await db.blogPost.create({
      data: {
        slug,
        title: b.title,
        subtitle: b.subtitle || null,
        author: b.author || "Call My Tailor",
        excerpt: b.excerpt || (b.text || "").slice(0, 200),
        contentHtml: rewriteHtmlImages(b.html) || `<p>${b.text || ""}</p>`,
        coverImage: localImg(b.image),
        metaTitle: b.meta_title || b.title,
        metaDescription: b.meta_description || (b.excerpt || "").slice(0, 300),
        isPublished: true,
      },
    });
  }
  console.log(`Blog posts: ${blog.length}`);

  // ---------------- Info pages ----------------
  const pages: any[] = read("pages.json");
  const slugRemap: Record<string, string> = { testionials: "testimonials" };
  for (const p of pages) {
    const slug = slugRemap[p.slug] || p.slug;
    let html = rewriteHtmlImages(p.html || "");
    if (html.replace(/<[^>]+>/g, "").trim().length < 60) {
      html = `<h2>${p.title}</h2><p>${p.text || "Content coming soon. Please contact us for details."}</p>`;
    }
    await db.infoPage.create({
      data: {
        slug,
        title: p.title || slug,
        contentHtml: html,
        metaTitle: p.meta_title || p.title || slug,
        metaDescription: (p.meta_description || p.text || "").slice(0, 300),
        isPublished: true,
      },
    });
  }
  console.log(`Info pages: ${pages.length}`);

  // ---------------- Settings ----------------
  const site: any = read("site.json");
  site.why_choose_us = home.why_choose_us || [];
  site.how_it_works = home.how_it_works || [];
  site.stats = home.stats || [];
  site.made_cta = home.made_cta || null;
  site.section_titles = home.section_titles || [];
  site.trending_tabs = home.trending_tabs || [];
  site.product_rails = home.product_rails || ["Best Sellers", "New Arrivals", "Most Rating"];
  for (const b of site.why_choose_us) b.icon = localImg(b.icon);

  const settings: Record<string, unknown> = {
    site,
    home_layout: {
      show_hero: true,
      show_how_it_works: true,
      show_specialization: true,
      show_order_by_category: true,
      show_rails: true,
      show_why_choose_us: true,
      show_trending: true,
      show_made_cta: true,
      show_fabric_brands: true,
      show_testimonials: true,
      show_stats: true,
      show_latest_blog: true,
    },
    seo: {
      default_title: "Call My Tailor — Custom Tailored Suits, Sherwani & Ethnic Wear at Your Doorstep",
      default_description:
        "Doorstep tailoring service in Delhi NCR. 2000+ fabrics, expert tailors, fully customised suits, blazers, sherwani, kurta & wedding wear with on-date delivery.",
    },
  };
  for (const [key, value] of Object.entries(settings)) {
    await db.setting.create({ data: { key, value: JSON.stringify(value) } });
  }
  console.log(`Settings: ${Object.keys(settings).length}`);
}

main()
  .then(async () => {
    await db.$disconnect();
    console.log("Seed complete ✔");
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });

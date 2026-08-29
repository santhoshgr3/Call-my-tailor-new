import * as cheerio from 'cheerio';
import { fetchHtml, save, load, abs, clean, BASE } from './lib.mjs';

const CATEGORY_TREE = [
  { slug: 'catalogue', name: 'Catalogue', url: `${BASE}/catalogue`, children: [] },
  {
    slug: 'suit-blazer', name: 'Suit / Blazer', url: `${BASE}/suit-blazer`, children: [
      { slug: 'formal-suit', name: 'Formal Suit', url: `${BASE}/suit-blazer/formal-suit` },
      { slug: 'party-suits', name: 'Party Suit', url: `${BASE}/suit-blazer/party-suits` },
      { slug: 'casual-suit', name: 'Casual Suit', url: `${BASE}/suit-blazer/casual-suit` },
      { slug: 'tuxedo', name: 'Tuxedo', url: `${BASE}/suit-blazer/tuxedo` },
    ],
  },
  {
    slug: 'ethnic-wear', name: 'Ethnic Wear', url: `${BASE}/ethnic-wear`, children: [
      { slug: 'bandhgala-suit', name: 'Bandhgala Suit', url: `${BASE}/ethnic-wear/bandhgala-suit` },
      { slug: 'kurta-jacket', name: 'Kurta Jacket', url: `${BASE}/ethnic-wear/kurta-jacket` },
      { slug: 'indo-western', name: 'Indo Western', url: `${BASE}/ethnic-wear/indo-western` },
      { slug: 'nehru-jacket', name: 'Nehru Jacket', url: `${BASE}/ethnic-wear/Nehru Jacket` },
    ],
  },
  {
    slug: 'kurta', name: 'Kurta', url: `${BASE}/kurta`, children: [
      { slug: 'simple-kurta', name: 'Simple Kurta', url: `${BASE}/kurta/simple-kurta` },
      { slug: 'punjabi-kurta', name: 'Punjabi Kurta', url: `${BASE}/kurta/punjabi-kurta` },
      { slug: 'pathani-kurta', name: 'Pathani Kurta', url: `${BASE}/kurta/pathani-kurta` },
      { slug: 'designer-kurta', name: 'Designer Kurta', url: `${BASE}/kurta/designer-kurta` },
    ],
  },
  {
    slug: 'accessories', name: 'Accessories', url: `${BASE}/accessories`, children: [
      { slug: 'tie', name: 'Tie', url: `${BASE}/accessories/tie` },
      { slug: 'broch', name: 'Broch', url: `${BASE}/accessories/broch` },
      { slug: 'cufflink', name: 'Cufflink', url: `${BASE}/accessories/cufflink` },
      { slug: 'pocket-square', name: 'Pocket Square', url: `${BASE}/accessories/pocket-square` },
    ],
  },
  {
    slug: 'regular-wear', name: 'Regular Wear', url: `${BASE}/regular-wear`, children: [
      { slug: 'pant-shirt', name: 'Pant Shirt', url: `${BASE}/regular-wear/pant-shirt` },
      { slug: 'trouser-chino', name: 'Trouser & Chino', url: `${BASE}/regular-wear/trouser-chino` },
      { slug: 'shirts', name: 'Shirts', url: `${BASE}/regular-wear/shirts` },
    ],
  },
  {
    slug: 'wedding-attire', name: 'Wedding Attire', url: `${BASE}/wedding-attire`, children: [
      { slug: 'wedding-suit', name: 'Wedding Suit', url: `${BASE}/wedding-attire/wedding-suit` },
      { slug: 'sherwani', name: 'Sherwani', url: `${BASE}/wedding-attire/sherwani` },
      { slug: 'achkan', name: 'Achkan', url: `${BASE}/wedding-attire/Achkan` },
    ],
  },
  {
    slug: 'wedding-accessories', name: 'Wedding Accessories', url: `${BASE}/wedding-accessories`, children: [
      { slug: 'malas', name: 'Malas', url: `${BASE}/wedding-accessories/malas` },
      { slug: 'safa-turban', name: 'Safa, Turban', url: `${BASE}/wedding-accessories/safa-turban` },
      { slug: 'stole', name: 'Stole', url: `${BASE}/wedding-accessories/stole` },
    ],
  },
];

const fullImg = (u) => (u ? u.replace(/-\d+x\d+(\.\w+)(\?.*)?$/, '$1') : null);
const priceNum = (s) => {
  const m = clean(s).replace(/[^\d.]/g, '');
  return m ? Math.round(parseFloat(m)) : null;
};

function parseListing($) {
  const out = [];
  const seen = new Set();
  $('.product-layout').each((_, el) => {
    const $el = $(el);
    const a = $el.find('a[href*="product_id="]').first();
    const href = a.attr('href') || '';
    const idm = href.match(/product_id=(\d+)/);
    if (!idm) return;
    const id = idm[1];
    if (seen.has(id)) return;
    seen.add(id);
    const name = clean($el.find('.caption h4 a, h4 a').first().text()) || clean(a.attr('title'));
    const img = fullImg($el.find('img').first().attr('data-src') || $el.find('img').first().attr('src'));
    const priceTxt = clean($el.find('.price-new, .price').first().text());
    out.push({ id, name, image: img, price: priceNum(priceTxt), price_text: priceTxt });
  });
  return out;
}

function lastPage($) {
  let max = 1;
  $('.pagination a, .pagination span').each((_, el) => {
    const href = $(el).attr('href') || '';
    const m = href.match(/page=(\d+)/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  const res = clean($('.results, .col-sm-6.text-right').text());
  const rm = res.match(/\((\d+)\s+Pages?\)/i);
  if (rm) max = Math.max(max, parseInt(rm[1], 10));
  return max;
}

async function crawlCategoryProducts(cat) {
  const map = new Map();
  const first = cheerio.load(await fetchHtml(`${cat.url}?page=1`));
  const pages = lastPage(first);
  parseListing(first).forEach((p) => map.set(p.id, p));
  for (let pg = 2; pg <= pages; pg++) {
    const $ = cheerio.load(await fetchHtml(`${cat.url}?page=${pg}`));
    parseListing($).forEach((p) => { if (!map.has(p.id)) map.set(p.id, p); });
  }
  console.log(`  ${cat.slug}: ${map.size} products across ${pages} page(s)`);
  return [...map.values()];
}

async function stepCategories() {
  const flat = [];
  const productIndex = new Map();
  for (const parent of CATEGORY_TREE) {
    const nodes = [parent, ...(parent.children || [])];
    for (const cat of nodes) {
      let items = [];
      try { items = await crawlCategoryProducts(cat); }
      catch (e) { console.warn('  FAIL', cat.slug, e.message); }
      cat.product_ids = items.map((i) => i.id);
      flat.push({ slug: cat.slug, name: cat.name, url: cat.url, parent: cat === parent ? null : parent.slug, product_ids: cat.product_ids });
      items.forEach((it) => {
        if (!productIndex.has(it.id)) productIndex.set(it.id, { ...it, categories: [] });
        productIndex.get(it.id).categories.push(cat.slug);
      });
    }
  }
  save('categories.json', flat);
  save('product-list.json', [...productIndex.values()]);
}

function parseProduct(html, id) {
  const $ = cheerio.load(html);
  const name = clean($('h1').first().text());
  const priceNew = clean($('.price-new').first().text());
  const priceOld = clean($('.price-old').first().text());
  const model = clean($('.model').text()).replace(/^Product Code:\s*/i, '');
  const stock = clean($('.stock').text()).replace(/^Availability:\s*/i, '');

  const images = new Set();
  const main = $('.large-image a').attr('href') || $('.large-image img').attr('data-src') || $('.large-image img').attr('src');
  if (main) images.add(fullImg(main));
  $('.image-additional a, .image-additional img, .thumbnails a').each((_, el) => {
    const u = $(el).attr('href') || $(el).attr('data-src') || $(el).attr('src');
    if (u && !u.startsWith('data:')) images.add(fullImg(u));
  });

  // description tab: split "Item specifics" table vs "Product Description"
  const descRaw = $('#tab-description').html() || '';
  const $d = cheerio.load(descRaw);
  const descText = clean($d.text());
  const specs = {};
  $d('li.property-item').each((_, li) => {
    const k = clean($d(li).find('.propery-title').text());
    const v = clean($d(li).find('.propery-des').text());
    if (k && v) specs[k] = v;
  });
  let productDescription = clean($d('#collapse-description').text());
  if (!productDescription) {
    const pdIdx = descText.indexOf('Product Description');
    if (pdIdx >= 0) productDescription = clean(descText.slice(pdIdx + 'Product Description'.length)).replace(/\s*Show More Show Less\s*$/i, '');
  }

  const options = [];
  $('#product .form-group, .product-options .form-group').each((_, el) => {
    const label = clean($(el).find('label, .control-label').first().text());
    const values = $(el).find('option').map((_, o) => clean($(o).text())).get().filter((v) => v && !/^---/.test(v));
    if (label) options.push({ label, values });
  });

  const meta_title = clean($('title').first().text());
  const meta_desc = $('meta[name="description"]').attr('content') || '';

  return {
    id, name,
    price: priceNum(priceNew), price_text: priceNew,
    price_old: priceNum(priceOld) || null,
    model, stock,
    images: [...images].filter(Boolean),
    specs,
    description: productDescription,
    description_full: descText,
    options,
    meta_title, meta_description: clean(meta_desc),
  };
}

async function stepProducts() {
  const list = load('product-list.json');
  const out = [];
  let n = 0;
  for (const p of list) {
    n++;
    try {
      const html = await fetchHtml(`${BASE}/index.php?route=product/product&product_id=${p.id}`);
      const detail = parseProduct(html, p.id);
      out.push({ ...p, ...detail, images: (detail.images && detail.images.length ? detail.images : [p.image]).filter(Boolean) });
    } catch (e) {
      console.warn('  FAIL product', p.id, e.message);
      out.push({ ...p, images: [p.image].filter(Boolean) });
    }
    if (n % 25 === 0) console.log(`  products ${n}/${list.length}`);
  }
  save('products.json', out);
}

async function stepBlog() {
  const posts = new Map();
  for (let pg = 1; pg <= 15; pg++) {
    const $ = cheerio.load(await fetchHtml(`${BASE}/index.php?route=extension/simple_blog/article&page=${pg}`));
    let found = 0;
    $('.blog-item, .blog-listitem').each((_, el) => {
      const $el = $(el);
      const a = $el.find('h2 a, h3 a, h4 a, .blog-name a, a').filter((_, x) => clean($(x).text()) && !/read more|comment/i.test($(x).text())).first();
      const url = abs(a.attr('href'));
      if (!url || posts.has(url)) return;
      posts.set(url, {
        url,
        title: clean(a.text()),
        list_image: fullImg($el.find('img').first().attr('data-src') || $el.find('img').first().attr('src')),
        list_excerpt: clean($el.find('p, .blog-desc, .article-sub-title').first().text()),
        date: clean($el.find('.blog-date, .article-date, [class*=date]').first().text()),
      });
      found++;
    });
    if (!found) break;
  }
  const out = [];
  for (const [url, meta] of posts) {
    if (meta.title.length > 120) continue; // skip "recent posts" aggregate widget
    try {
      const $ = cheerio.load(await fetchHtml(url));
      const c = $('#content');
      out.push({
        slug: url.replace(BASE + '/', '').replace(/\/$/, ''),
        url,
        title: clean(c.find('.article-title').text()) || meta.title,
        subtitle: clean(c.find('.article-sub-title').text()),
        author: clean(c.find('.article-author').text()),
        date: clean(c.find('.article-date').text()) || meta.date,
        image: fullImg(c.find('.article-image img').attr('src') || c.find('.article-image img').attr('data-src') || meta.list_image),
        excerpt: meta.list_excerpt || clean($('meta[name="description"]').attr('content') || ''),
        meta_title: clean($('title').text()),
        meta_description: clean($('meta[name="description"]').attr('content') || ''),
        html: (c.find('.article-description').html() || '').trim(),
        text: clean(c.find('.article-description').text()),
      });
    } catch (e) { console.warn('  FAIL blog', url, e.message); }
  }
  save('blog.json', out);
}

async function stepPages() {
  const slugs = [
    'about-us', 'how-it-works', 'why-callmytailor', 'gallery', 'faqs', 'price-list',
    'how-to-choose-fabrics', 'customer-support', 'complaint-advice', 'join-us',
    'track-my-order', 'payment-method', 'privacy-policy', 'terms-and-conditions',
    'refund-replacement', 'testionials',
  ];
  const out = [];
  for (const slug of slugs) {
    try {
      const $ = cheerio.load(await fetchHtml(`${BASE}/${slug}`));
      out.push({
        slug,
        title: clean($('h1').first().text()) || clean($('title').text()),
        meta_title: clean($('title').text()),
        meta_description: clean($('meta[name="description"]').attr('content') || ''),
        html: ($('#content').first().html() || '').trim(),
        text: clean($('#content').first().text()),
      });
    } catch (e) { console.warn('  FAIL page', slug, e.message); }
  }
  save('pages.json', out);
}

async function stepHome() {
  const $ = cheerio.load(await fetchHtml(`${BASE}/index.php?route=common/home`));
  const home = {};

  home.slides = $('.home-slider .item, #my-pics .item').map((_, el) => ({
    src: abs($(el).find('img').attr('src') || $(el).find('img').attr('data-src')),
    alt: clean($(el).find('img').attr('alt')),
    link: abs($(el).find('a').attr('href')),
  })).get().filter((s) => s.src);

  home.why_choose_us = $('.why-sec .why-box').map((_, el) => ({
    icon: abs($(el).find('img').attr('src')),
    title: clean($(el).find('h2, h3, .why-txt h2').first().text()),
    text: clean($(el).find('p').first().text()),
  })).get().filter((x) => x.title);

  home.how_it_works = $('.how-area li, .howitwork li, ul.how-list li').map((_, el) => ({
    title: clean($(el).find('a').first().text()) || clean($(el).find('h3,h4').first().text()),
    text: clean($(el).find('p').first().text()),
  })).get().filter((x) => x.title);

  home.testimonials = $('.reviewtxt').map((_, el) => ({
    text: clean($(el).find('h2').first().text()),
    name: clean($(el).find('h3').first().text()),
    role: clean($(el).find('p').first().text()),
    fb: $(el).find('a.sociallink').attr('href') || null,
  })).get().filter((x) => x.text || x.name);

  const counts = $('.counter, h2.counter').map((_, el) => ({
    value: $(el).attr('data-count') || clean($(el).text()),
    label: clean($(el).closest('.achievement-box, div').find('p').first().text()) || clean($(el).next('p').text()),
  })).get().filter((x) => x.value);
  home.stats = counts.length ? counts : [
    { value: '5485', label: 'Happy Clients' },
    { value: '15', label: 'Year Experience' },
    { value: '250', label: 'Tailor & Designer' },
    { value: '14580', label: 'Product Delivered' },
  ];

  home.fabric_brands = $('.slider-brands .item img, .fabricbranddesk img').map((_, el) => abs($(el).attr('src') || $(el).attr('data-src'))).get().filter(Boolean);

  home.made_cta = {
    title: clean($('.madecontent h2').text()),
    text: clean($('.madecontent p').text()),
    button: clean($('.made-area a').first().text()) || 'BOOK VISIT & ORDER NOW',
    link: abs($('.made-area a').first().attr('href')) || 'https://booking.callmytailor.com/',
  };

  home.promo_banners = $('.banner21 img, .sliderimages img, .sldierright img').map((_, el) => ({
    src: abs($(el).attr('src') || $(el).attr('data-src')),
    alt: clean($(el).attr('alt')),
    link: abs($(el).closest('a').attr('href')),
  })).get().filter((b) => b.src && !b.src.startsWith('data:'));

  home.section_titles = $('.modtitle, .module-title, h3.modtitle span, .bloc-title').map((_, el) => clean($(el).text())).get().filter(Boolean);

  home.raw_text = clean($('#content').first().text()).slice(0, 10000);
  home.html = ($('#content').first().html() || '').slice(0, 400000);
  save('home.json', home);
}

async function stepFooter() {
  const $ = cheerio.load(await fetchHtml(`${BASE}/index.php?route=common/home`));
  const footer = {
    html: ($('footer').first().html() || '').trim(),
    text: clean($('footer').first().text()),
    links: $('footer a').map((_, el) => ({ text: clean($(el).text()), href: abs($(el).attr('href')) })).get().filter((l) => l.text),
    socials: $('a[href*="instagram"],a[href*="facebook"],a[href*="linkedin"],a[href*="youtube"],a[href*="pinterest"],a[href*="whatsapp"]').map((_, el) => abs($(el).attr('href'))).get(),
    phone: ($('a[href^="tel:"]').attr('href') || '').replace('tel:', '') || (($('body').text().match(/\b(?:\+?91[ -]?)?[6-9]\d{9}\b/) || [])[0] || null),
    whatsapp: ($('a[href*="whatsapp"]').attr('href') || '').match(/phone=(\d+)/)?.[1] || '918882222900',
    emails: [...new Set(($('body').html() || '').match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [])].filter((e) => !/\.(png|jpg|jpeg|gif|webp)$/i.test(e)),
  };
  save('footer.json', footer);
}

const step = process.argv[2];
const steps = { categories: stepCategories, products: stepProducts, blog: stepBlog, pages: stepPages, home: stepHome, footer: stepFooter };
if (step === 'all') {
  for (const k of ['categories', 'products', 'blog', 'pages', 'home', 'footer']) { console.log('== STEP', k); await steps[k](); }
} else if (steps[step]) {
  await steps[step]();
} else {
  console.log('usage: node scrape.mjs <categories|products|blog|pages|home|footer|all>');
}

import Script from "next/script";
import type { PluginValue } from "@/lib/plugin-defs";
import type { SiteConfig } from "@/lib/settings";

type Cfg = Record<string, PluginValue>;

const ID = /^[A-Za-z0-9_-]{3,40}$/;
const clean = (v: PluginValue | undefined) => {
  const s = String(v ?? "").trim();
  return ID.test(s) ? s : "";
};

/** Google Analytics 4, Tag Manager, Meta Pixel and Search Console — IDs are validated before use. */
export function AnalyticsScripts({ cfg }: { cfg: Cfg }) {
  const ga = clean(cfg.ga4_id);
  const gtm = clean(cfg.gtm_id);
  const pixel = String(cfg.meta_pixel_id ?? "").trim().replace(/[^0-9]/g, "");
  const gsc = String(cfg.gsc_verification ?? "").trim();

  return (
    <>
      {gsc && /^[A-Za-z0-9_-]{10,100}$/.test(gsc) && (
        <meta name="google-site-verification" content={gsc} />
      )}
      {ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="cmt-ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`}
          </Script>
        </>
      )}
      {gtm && (
        <Script id="cmt-gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`}
        </Script>
      )}
      {pixel && (
        <Script id="cmt-meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}

function safeJson(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** LocalBusiness data for search engines. */
export function BusinessJsonLd({
  site,
  cfg,
  baseUrl,
}: {
  site: SiteConfig;
  cfg: Cfg;
  baseUrl: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: site.brand,
    description: site.tagline,
    url: baseUrl,
    logo: site.logo ? new URL(site.logo, baseUrl).toString() : new URL("/logo.png", baseUrl).toString(),
    image: site.logo ? new URL(site.logo, baseUrl).toString() : new URL("/logo.png", baseUrl).toString(),
    telephone: site.contact?.phone,
    email: site.contact?.email,
    priceRange: String(cfg.price_range || ""),
    address: site.contact?.address
      ? { "@type": "PostalAddress", streetAddress: site.contact.address, addressCountry: "IN" }
      : undefined,
    sameAs: Object.values(site.socials ?? {}).filter(Boolean),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(data) }} />;
}

export function ProductJsonLd({
  baseUrl,
  product,
}: {
  baseUrl: string;
  product: {
    slug: string;
    name: string;
    description: string | null;
    sku: string | null;
    price: number;
    inStock: boolean;
    images: string[];
    rating: number;
    ratingCount: number;
  };
}) {
  const abs = (u: string) => {
    try {
      return new URL(u, baseUrl).toString();
    } catch {
      return u;
    }
  };
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    sku: product.sku || undefined,
    image: product.images.map(abs),
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/product/${product.slug}`,
      priceCurrency: "INR",
      price: product.price,
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
  if (product.ratingCount > 0 && product.rating > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.ratingCount,
    };
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(data) }} />;
}

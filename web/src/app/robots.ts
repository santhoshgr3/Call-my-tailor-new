import type { MetadataRoute } from "next";

function base() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export default function robots(): MetadataRoute.Robots {
  const b = base();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/account", "/checkout", "/cart"],
      },
    ],
    sitemap: `${b}/sitemap.xml`,
    host: b,
  };
}

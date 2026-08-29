import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart/CartProvider";
import { getSetting } from "@/lib/settings";

// This is a database-backed store (cart, orders, admin) — never statically
// prerender. Also lets `next build` succeed before DATABASE_URL is wired up.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSetting<{ default_title: string; default_description: string }>("seo", {
    default_title: "Call My Tailor",
    default_description: "Custom tailoring at your doorstep.",
  });
  return {
    title: { default: seo.default_title, template: "%s | Call My Tailor" },
    description: seo.default_description,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}

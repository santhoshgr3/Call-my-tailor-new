import { CartDrawer } from "@/components/cart/CartDrawer";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { getMenuTree } from "@/lib/catalog";
import { getSiteConfig } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menu, site, user] = await Promise.all([
    getMenuTree(),
    getSiteConfig(),
    getCurrentUser(),
  ]);

  return (
    <>
      <SiteHeader
        menu={menu}
        site={site}
        session={user ? { firstName: user.firstName, role: user.role } : null}
      />
      <main className="min-h-[50vh]">{children}</main>
      <SiteFooter site={site} />
      <WhatsAppFab number={site.contact?.whatsapp || "918882222900"} />
      <CartDrawer />
    </>
  );
}

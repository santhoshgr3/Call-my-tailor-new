import { CartDrawer } from "@/components/cart/CartDrawer";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import {
  AnnouncementBar,
  PromoPopup,
  CookieNotice,
  BackToTop,
  MobileBottomBar,
  CustomCode,
  MaintenanceGate,
} from "@/components/plugins/ClientPlugins";
import { AnalyticsScripts, BusinessJsonLd } from "@/components/plugins/PluginScripts";
import { getMenuTree } from "@/lib/catalog";
import { getSiteConfig } from "@/lib/settings";
import { getPlugins, safeHref, safeColor } from "@/lib/plugins";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menu, site, user, P] = await Promise.all([
    getMenuTree(),
    getSiteConfig(),
    getCurrentUser(),
    getPlugins(),
  ]);

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const wa = P["whatsapp-chat"];
  const bar = P["announcement-bar"];
  const popup = P["promo-popup"];
  const cookie = P["cookie-notice"];
  const mobile = P["mobile-bottom-bar"];
  const top = P["back-to-top"];
  const analytics = P["analytics"];
  const seo = P["structured-data"];
  const custom = P["custom-code"];
  const maintenance = P["maintenance-mode"];
  const css = String(custom.config.css || "").replace(/<\/style/gi, "");

  const page = (
    <>
      {bar.enabled && String(bar.config.message).trim() && (
        <AnnouncementBar
          message={String(bar.config.message)}
          link={safeHref(bar.config.link)}
          linkLabel={String(bar.config.link_label || "")}
          bg={safeColor(bar.config.bg, "#10131d")}
          fg={safeColor(bar.config.fg, "#ffffff")}
          dismissible={bar.config.dismissible !== false}
        />
      )}
      <SiteHeader
        menu={menu}
        site={site}
        session={user ? { firstName: user.firstName, role: user.role } : null}
      />
      <main className="min-h-[50vh]">{children}</main>
      <SiteFooter site={site} />
      {mobile.enabled && <div className="h-14 md:hidden" />}

      {wa.enabled && (
        <WhatsAppFab
          number={String(wa.config.number || "") || site.contact?.whatsapp || "918882222900"}
          message={String(wa.config.message || "")}
          position={String(wa.config.position || "right")}
          liftOnMobile={mobile.enabled}
        />
      )}
      <CartDrawer />

      {mobile.enabled && (
        <MobileBottomBar
          homeLabel={String(mobile.config.home_label)}
          searchLabel={String(mobile.config.search_label)}
          cartLabel={String(mobile.config.cart_label)}
          accountLabel={String(mobile.config.account_label)}
        />
      )}
      {top.enabled && <BackToTop position={String(top.config.position)} />}
      {cookie.enabled && (
        <CookieNotice
          message={String(cookie.config.message)}
          buttonLabel={String(cookie.config.button_label)}
          linkLabel={String(cookie.config.link_label)}
          link={safeHref(cookie.config.link)}
        />
      )}
      {popup.enabled && (
        <PromoPopup
          title={String(popup.config.title)}
          text={String(popup.config.text)}
          image={String(popup.config.image || "")}
          collectEmail={popup.config.collect_email !== false}
          buttonLabel={String(popup.config.button_label)}
          buttonLink={safeHref(popup.config.button_link)}
          delay={Number(popup.config.delay) || 0}
          repeatDays={Number(popup.config.repeat_days) || 0}
        />
      )}

      {analytics.enabled && <AnalyticsScripts cfg={analytics.config} />}
      {seo.enabled && <BusinessJsonLd site={site} cfg={seo.config} baseUrl={baseUrl} />}
      {custom.enabled && css.trim() && <style dangerouslySetInnerHTML={{ __html: css }} />}
      {custom.enabled && (
        <CustomCode headHtml={String(custom.config.head_html || "")} bodyHtml={String(custom.config.body_html || "")} />
      )}
    </>
  );

  if (maintenance.enabled && user?.role !== "admin") {
    return (
      <MaintenanceGate
        title={String(maintenance.config.title)}
        message={String(maintenance.config.message)}
      >
        {page}
      </MaintenanceGate>
    );
  }
  return page;
}

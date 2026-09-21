import type { Metadata } from "next";
import { CartView } from "./CartView";
import { getSiteConfig, DEFAULT_STORE } from "@/lib/settings";

export const metadata: Metadata = { title: "Shopping Cart" };

export default async function CartPage() {
  const site = await getSiteConfig();
  return (
    <div className="container-cmt py-10">
      <h1 className="mb-6 text-2xl">Shopping Cart</h1>
      <CartView store={site.store ?? DEFAULT_STORE} />
    </div>
  );
}

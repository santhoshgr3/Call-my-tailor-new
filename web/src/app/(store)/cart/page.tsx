import type { Metadata } from "next";
import { CartView } from "./CartView";

export const metadata: Metadata = { title: "Shopping Cart" };

export default function CartPage() {
  return (
    <div className="container-cmt py-10">
      <h1 className="mb-6 text-2xl">Shopping Cart</h1>
      <CartView />
    </div>
  );
}

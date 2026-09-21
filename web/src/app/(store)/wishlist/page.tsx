import type { Metadata } from "next";
import { WishlistView } from "@/components/shop/WishlistView";

export const metadata: Metadata = { title: "My Wish List" };

export default function WishlistPage() {
  return (
    <div className="container-cmt py-8">
      <h1 className="section-title mb-6">My Wish List</h1>
      <WishlistView />
    </div>
  );
}

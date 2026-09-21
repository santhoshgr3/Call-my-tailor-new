import type { Metadata } from "next";
import { CompareView } from "@/components/shop/CompareView";

export const metadata: Metadata = { title: "Compare Products" };

export default function ComparePage() {
  return (
    <div className="container-cmt py-8">
      <h1 className="section-title mb-6">Product Comparison</h1>
      <CompareView />
    </div>
  );
}

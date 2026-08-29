"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";

type Props = {
  product: {
    productId: string;
    slug: string;
    name: string;
    price: number;
    image: string;
  };
  qty?: number;
  options?: Record<string, string>;
  className?: string;
  label?: string;
};

export function AddToCartButton({
  product,
  qty = 1,
  options,
  className = "btn-brand",
  label = "Add to Cart",
}: Props) {
  const { add } = useCart();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        add({ ...product, qty, options });
        setDone(true);
        setTimeout(() => setDone(false), 1400);
      }}
    >
      {done ? "Added ✓" : label}
    </button>
  );
}

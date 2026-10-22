"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart/CartProvider";

/** After a redirect-style payment the cart is still full; empty it once the order is confirmed. */
export function ClearCart() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}

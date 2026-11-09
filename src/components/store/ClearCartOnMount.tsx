"use client";

import { useEffect } from "react";
import { SUBMIT_KEY, useCart } from "./CartProvider";

export default function ClearCartOnMount() {
  const { clear, ready } = useCart();
  useEffect(() => {
    if (!ready) return;
    clear();
    try {
      sessionStorage.removeItem(SUBMIT_KEY);
    } catch {
      /* ignore */
    }
  }, [ready, clear]);
  return null;
}
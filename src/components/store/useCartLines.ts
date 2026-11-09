"use client";

import { useEffect, useState } from "react";
import { getCartLinesAction } from "@/modules/cart/actions";
import type { CartSummary } from "@/modules/cart/types";
import { useCart } from "./CartProvider";

const EMPTY: CartSummary = { lines: [], subtotal: "0.00", allOk: false };

export function useCartLines() {
  const { items, ready } = useCart();
  const key = JSON.stringify(items);
  const [result, setResult] = useState<{ key: string; summary: CartSummary } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ready || items.length === 0) return;
    let cancelled = false;
    getCartLinesAction(items)
      .then((summary) => {
        if (cancelled) return;
        setResult({ key, summary });
        setFailed(false);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);

  const fresh = items.length === 0 || result?.key === key;
  const summary = items.length === 0 ? EMPTY : (result?.summary ?? null);
  return { summary, fresh, failed };
}
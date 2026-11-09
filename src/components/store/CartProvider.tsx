"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from "react";
import { QUANTITY_RE, type CartItem } from "@/modules/cart/types";

const KEY = "miky_cart_v1";
export const SUBMIT_KEY = "miky_submit_key";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CartContextValue = {
  items: CartItem[];
  ready: boolean;
  count: number;
  add: (productId: string, quantity: string) => void;
  setQty: (productId: string, quantity: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function sum(a: string, b: string) {
  return String(Math.round((Number(a) + Number(b)) * 1000) / 1000);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      if (Array.isArray(raw)) {
        setItems(
          raw
            .filter(
              (i): i is CartItem =>
                typeof i?.productId === "string" &&
                UUID_RE.test(i.productId) &&
                typeof i?.quantity === "string" &&
                QUANTITY_RE.test(i.quantity),
            )
            .slice(0, 50),
        );
      }
    } catch {
      /* ignore unreadable cart */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* storage may be blocked */
    }
  }, [items, ready]);

  const add = useCallback((productId: string, quantity: string) => {
    setItems((prev) => {
      const found = prev.find((i) => i.productId === productId);
      if (found) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: sum(i.quantity, quantity) } : i,
        );
      }
      return prev.length >= 50 ? prev : [...prev, { productId, quantity }];
    });
  }, []);

  const setQty = useCallback((productId: string, quantity: string) => {
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({ items, ready, count: items.length, add, setQty, remove, clear }),
    [items, ready, add, setQty, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export default function CartLink() {
  const { count, ready } = useCart();
  const n = ready ? count : 0;
  return (
    <Link
      href="/cart"
      aria-label={n > 0 ? `Cart, ${n} items` : "Cart"}
      className="flex items-center gap-2 rounded-full border border-gold px-4 py-2 font-semibold text-gold hover:bg-gold hover:text-background"
    >
      Cart
      {n > 0 && (
        <span className="grid min-w-5 place-items-center rounded-full bg-gold px-1.5 text-xs font-bold text-background">
          {n}
        </span>
      )}
    </Link>
  );
}
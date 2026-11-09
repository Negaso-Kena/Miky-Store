"use client";

import Link from "next/link";
import { useState } from "react";
import { isValidQuantity } from "@/modules/products/units";
import { useCart } from "./CartProvider";

export default function AddToCart({
  productId,
  unitCode,
  canOrder,
}: {
  productId: string;
  unitCode: string;
  canOrder: boolean;
}) {
  const { add } = useCart();
  const [qty, setQty] = useState("1");
  const [added, setAdded] = useState(false);
  const value = qty.trim();
  const valid = isValidQuantity(unitCode, value);

  if (!canOrder) {
    return (
      <p className="mt-5 rounded-xl border border-line bg-surface p-4 text-sm text-muted">
        This product cannot be ordered right now. Contact the shop to ask about availability.
      </p>
    );
  }

  return (
    <div className="mt-6">
      <label htmlFor="qty" className="mb-1 block text-sm font-semibold">
        Quantity ({unitCode})
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <input
          id="qty"
          inputMode="decimal"
          value={qty}
          onChange={(e) => {
            setQty(e.target.value);
            setAdded(false);
          }}
          aria-invalid={!valid}
          className="w-28 rounded-xl border border-line bg-background px-3 py-2.5"
        />
        <button
          type="button"
          disabled={!valid}
          onClick={() => {
            add(productId, value);
            setAdded(true);
          }}
          className="rounded-full bg-gold px-8 py-3 font-bold text-background hover:bg-gold-light disabled:opacity-50"
        >
          Add to cart
        </button>
      </div>
      <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm">
        {!valid && (
          <span className="text-danger">
            {unitCode === "meter"
              ? "Enter a quantity with up to 3 decimals."
              : "Enter a whole number."}
          </span>
        )}
        {added && valid && (
          <span className="text-gold-light">
            Added to your cart.{" "}
            <Link href="/cart" className="underline">View cart</Link>
          </span>
        )}
      </p>
    </div>
  );
}
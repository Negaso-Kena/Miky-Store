"use client";

import Link from "next/link";
import { useState } from "react";
import { formatEtb } from "@/lib/format";
import type { LineStatus } from "@/modules/cart/types";
import { isValidQuantity } from "@/modules/products/units";
import { useCart } from "./CartProvider";
import { useCartLines } from "./useCartLines";

const STATUS_TEXT: Record<LineStatus, string | null> = {
  ok: null,
  unavailable: "No longer available. Remove it to continue.",
  invalid: "This quantity is not valid for this product.",
  insufficient: "More than we have in stock. Reduce the quantity or contact the shop.",
};

function QtyInput({ productId, unitCode, value }: { productId: string; unitCode: string; value: string }) {
  const { setQty } = useCart();
  const [text, setText] = useState(value);
  const valid = isValidQuantity(unitCode, text.trim());

  return (
    <div>
      <label htmlFor={`qty-${productId}`} className="sr-only">Quantity</label>
      <input
        id={`qty-${productId}`}
        inputMode="decimal"
        value={text}
        aria-invalid={!valid}
        onChange={(e) => {
          setText(e.target.value);
          const v = e.target.value.trim();
          if (isValidQuantity(unitCode, v)) setQty(productId, v);
        }}
        className="w-24 rounded-xl border border-line bg-background px-3 py-2"
      />
      {!valid && <p className="mt-1 text-xs text-danger">Invalid quantity</p>}
    </div>
  );
}

export default function CartView() {
  const { items, remove, ready } = useCart();
  const { summary, fresh, failed } = useCartLines();

  if (!ready) return <p className="text-muted">Loading your cart...</p>;

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-line p-10 text-center text-muted">
        <p className="text-lg font-semibold text-foreground">Your cart is empty</p>
        <Link href="/shop" className="mt-4 inline-block rounded-full bg-gold px-7 py-3 font-bold text-background hover:bg-gold-light">
          Browse products
        </Link>
      </div>
    );
  }

  if (!summary) {
    return failed ? (
      <p role="alert" className="text-danger">
        We could not load your cart. Check your connection and reload the page.
      </p>
    ) : (
      <p className="text-muted">Checking prices and availability...</p>
    );
  }

  const canCheckout = fresh && summary.allOk;

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
        {summary.lines.map((line) => {
          const item = items.find((i) => i.productId === line.productId);
          if (!item) return null;
          const problem = STATUS_TEXT[line.status];
          return (
            <li key={line.productId} className="flex flex-wrap items-start gap-4 p-4">
              <div className="min-w-0 flex-1">
                {line.slug ? (
                  <Link href={`/products/${line.slug}`} className="font-semibold hover:text-gold-light">
                    {line.name}
                  </Link>
                ) : (
                  <span className="font-semibold">{line.name}</span>
                )}
                <p className="text-sm text-muted">
                  {formatEtb(line.price)} per {line.unitCode}
                </p>
                {problem && <p role="alert" className="mt-1 text-sm text-danger">{problem}</p>}
              </div>
              <QtyInput productId={line.productId} unitCode={line.unitCode} value={item.quantity} />
              <div className="w-28 text-right font-bold">{formatEtb(line.lineTotal)}</div>
              <button
                type="button"
                onClick={() => remove(line.productId)}
                aria-label={`Remove ${line.name}`}
                className="text-sm text-muted underline hover:text-danger"
              >
                Remove
              </button>
            </li>
          );
        })}
      </ul>

      <aside className="h-fit rounded-2xl border border-line bg-surface p-5">
        <div className="flex justify-between text-lg font-bold">
          <span>Subtotal</span>
          <span>{formatEtb(summary.subtotal)}</span>
        </div>
        <p className="mt-2 text-sm text-muted">
          Delivery fee is confirmed by the shop after you order. Pickup is free.
        </p>
        {canCheckout ? (
          <Link href="/checkout" className="mt-5 block rounded-full bg-gold px-6 py-3 text-center font-bold text-background hover:bg-gold-light">
            Continue to checkout
          </Link>
        ) : (
          <span aria-disabled="true" className="mt-5 block rounded-full bg-gold/40 px-6 py-3 text-center font-bold text-background">
            {fresh ? "Fix the items above" : "Checking..."}
          </span>
        )}
      </aside>
    </div>
  );
}
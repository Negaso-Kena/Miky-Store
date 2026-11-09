"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useState } from "react";
import { formatEtb } from "@/lib/format";
import { uuid } from "@/lib/uuid";
import type { FormState } from "@/modules/categories/types";
import { placeOrderAction } from "@/modules/orders/actions";
import { SUBMIT_KEY, useCart } from "./CartProvider";
import { useCartLines } from "./useCartLines";

const field = "w-full rounded-xl border border-line bg-background px-3 py-2.5";
const label = "mb-1 block text-sm font-semibold";

export default function CheckoutForm({
  shopAddress,
  deliveryCoverage,
}: {
  shopAddress: string | null;
  deliveryCoverage: string | null;
}) {
  const { items, ready } = useCart();
  const { summary, fresh } = useCartLines();
  const [state, formAction, pending] = useActionState<FormState, FormData>(placeOrderAction, {});
  const [method, setMethod] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [submissionKey, setSubmissionKey] = useState("");

  useEffect(() => {
    let key = "";
    try {
      key = sessionStorage.getItem(SUBMIT_KEY) ?? "";
      if (!key) {
        key = uuid();
        sessionStorage.setItem(SUBMIT_KEY, key);
      }
    } catch {
      key = uuid();
    }
    setSubmissionKey(key);
  }, []);

  if (!ready) return <p className="text-muted">Loading...</p>;

  if (items.length === 0) {
    return (
      <p className="text-muted">
        Your cart is empty.{" "}
        <Link href="/shop" className="text-gold-light underline">Browse products</Link>
      </p>
    );
  }

  if (!summary) return <p className="text-muted">Checking prices and availability...</p>;

  if (fresh && !summary.allOk) {
    return (
      <p role="alert" className="text-danger">
        Some items in your cart need attention.{" "}
        <Link href="/cart" className="underline">Go back to the cart</Link>
      </p>
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_340px]">
      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-line bg-surface p-6">
        <p className="text-sm text-muted">No account needed. Payment is arranged directly with the shop.</p>

        <input type="hidden" name="submissionKey" value={submissionKey} />
        <input type="hidden" name="cart" value={JSON.stringify(items)} />
        <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="website">Leave this field empty</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <div>
          <label htmlFor="name" className={label}>Full name</label>
          <input id="name" name="name" required autoComplete="name" className={field} />
        </div>
        <div>
          <label htmlFor="phone" className={label}>Telephone number</label>
          <input id="phone" name="phone" type="tel" inputMode="tel" required autoComplete="tel" placeholder="0911223344" className={field} />
        </div>

        <fieldset>
          <legend className={label}>How do you want to receive your order?</legend>
          <label className="mt-2 flex cursor-pointer gap-3 rounded-xl border border-line p-3 has-[:checked]:border-gold">
            <input type="radio" name="method" value="PICKUP" checked={method === "PICKUP"} onChange={() => setMethod("PICKUP")} className="mt-1" />
            <span>
              <strong>Shop pickup</strong>
              <span className="block text-sm text-muted">
                No delivery fee.{shopAddress ? ` ${shopAddress}` : ""}
              </span>
            </span>
          </label>
          <label className="mt-2 flex cursor-pointer gap-3 rounded-xl border border-line p-3 has-[:checked]:border-gold">
            <input type="radio" name="method" value="DELIVERY" checked={method === "DELIVERY"} onChange={() => setMethod("DELIVERY")} className="mt-1" />
            <span>
              <strong>Home delivery</strong>
              <span className="block text-sm text-muted">
                The shop confirms the delivery fee with you.
                {deliveryCoverage ? ` Areas: ${deliveryCoverage}` : ""}
              </span>
            </span>
          </label>
        </fieldset>

        {method === "DELIVERY" && (
          <div>
            <label htmlFor="address" className={label}>Delivery address</label>
            <textarea id="address" name="address" rows={3} required minLength={8} className={field} />
          </div>
        )}

        <div>
          <label htmlFor="note" className={label}>Note (optional)</label>
          <textarea id="note" name="note" rows={2} maxLength={1000} className={field} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending || !submissionKey || !fresh}
            className="rounded-full bg-gold px-8 py-3 font-bold text-background hover:bg-gold-light disabled:opacity-60"
          >
            {pending ? "Submitting..." : "Submit order"}
          </button>
          <p role="alert" aria-live="polite" className="text-sm text-danger">{state.error}</p>
        </div>
      </form>

      <aside className="h-fit rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-3 font-bold">Order summary</h2>
        <ul className="space-y-2 text-sm">
          {summary.lines.map((l) => (
            <li key={l.productId} className="flex justify-between gap-3">
              <span>{l.name} × {l.quantity}</span>
              <span>{formatEtb(l.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-line pt-3 font-bold">
          <span>Subtotal</span>
          <span>{formatEtb(summary.subtotal)}</span>
        </div>
        <p className="mt-3 rounded-xl border border-gold/40 bg-gold/10 p-3 text-sm text-[#ecd9a6]">
          Submitting is a request, not a confirmed sale. The shop will contact you to
          confirm availability{method === "DELIVERY" ? " and the delivery fee" : ""}.
        </p>
      </aside>
    </div>
  );
}
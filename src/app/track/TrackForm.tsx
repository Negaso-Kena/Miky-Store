"use client";

import { useActionState } from "react";
import { formatEtb } from "@/lib/format";
import type { TrackState } from "@/modules/orders/track";
import { trackOrderAction } from "@/modules/orders/track-action";

const field = "w-full rounded-xl border border-line bg-background px-3 py-2.5";
const label = "mb-1 block text-sm font-semibold";

export default function TrackForm({ defaultRef }: { defaultRef: string }) {
  // state holds either an error message or the order to display.
  const [state, action, pending] = useActionState<TrackState, FormData>(
    trackOrderAction,
    {},
  );
  const order = state.order;

  return (
    <div className="grid gap-6 md:grid-cols-[360px_1fr]">
      <form action={action} className="h-fit rounded-2xl border border-line bg-surface p-6">
        <div>
          <label htmlFor="ref" className={label}>Order reference</label>
          <input
            id="ref"
            name="ref"
            required
            defaultValue={defaultRef}
            placeholder="MK-XXXX-XXXX"
            autoComplete="off"
            className={`${field} uppercase`}
          />
        </div>
        <div className="mt-4">
          <label htmlFor="phone" className={label}>Telephone number used for the order</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            required
            autoComplete="tel"
            className={field}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="mt-5 w-full rounded-full bg-gold px-6 py-3 font-bold text-background hover:bg-gold-light disabled:opacity-60"
        >
          {pending ? "Checking..." : "Check my order"}
        </button>
        {/* role="alert" makes screen readers announce the error */}
        <p role="alert" className="mt-3 min-h-5 text-sm text-danger">{state.error}</p>
      </form>

      <section aria-live="polite" className="rounded-2xl border border-line bg-surface p-6">
        {!order ? (
          <p className="text-muted">
            Enter your reference and telephone number to see your order status.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="font-display text-2xl font-bold text-gold">{order.reference}</h2>
              <span className="rounded-full border border-gold px-4 py-1 text-sm font-semibold">
                {order.statusLabel}
              </span>
            </div>
            <p className="mt-2 text-[#d9d3c7]">{order.statusMessage}</p>
            <p className="mt-1 text-sm text-muted">
              {order.method === "PICKUP" ? "Shop pickup" : "Home delivery"} · Placed {order.placedAt}
            </p>

            <ul className="mt-5 divide-y divide-line border-y border-line text-sm">
              {order.items.map((i, idx) => (
                <li key={idx} className="flex justify-between gap-4 py-2">
                  <span>{i.name} × {i.quantity} {i.unit}</span>
                  <span>{formatEtb(i.lineTotal)}</span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatEtb(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Delivery fee</dt>
                {/* null means the shop has not entered the fee yet */}
                <dd>{order.deliveryFee === null ? "To be confirmed" : formatEtb(order.deliveryFee)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 font-bold">
                <dt>Total</dt>
                <dd>{order.total === null ? "To be confirmed" : formatEtb(order.total)}</dd>
              </div>
            </dl>
          </>
        )}
      </section>
    </div>
  );
}
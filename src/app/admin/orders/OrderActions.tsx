"use client";

import { useActionState } from "react";
import type { FormState } from "@/modules/categories/types";
import {
  advanceStatusAction,
  cancelOrderAction,
  confirmOrderAction,
  setDeliveryFeeAction,
} from "@/modules/orders/admin-actions";

const field = "rounded-xl border border-line bg-background px-3 py-2.5";
const gold =
  "rounded-full bg-gold px-6 py-2.5 font-bold text-background hover:bg-gold-light disabled:opacity-60";

function Msg({ state }: { state: FormState }) {
  return (
    <p role="status" aria-live="polite" className="text-sm">
      {state.error && <span className="text-danger">{state.error}</span>}
      {state.success && <span className="text-gold-light">{state.success}</span>}
    </p>
  );
}

export function FeeForm({ orderId, current }: { orderId: string; current: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(setDeliveryFeeAction, {});
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="orderId" value={orderId} />
      <div>
        <label htmlFor="fee" className="mb-1 block text-sm font-semibold">
          Delivery fee (ETB)
        </label>
        <input id="fee" name="fee" inputMode="decimal" required defaultValue={current} className={`${field} w-40`} />
      </div>
      <button type="submit" disabled={pending} className={gold}>
        {pending ? "Saving..." : "Save fee"}
      </button>
      <Msg state={state} />
    </form>
  );
}

export function ConfirmForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(confirmOrderAction, {});
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm("Confirm this order and deduct the stock now?")) e.preventDefault();
      }}
      className="flex flex-wrap items-center gap-3"
    >
      <input type="hidden" name="orderId" value={orderId} />
      <button type="submit" disabled={pending} className={gold}>
        {pending ? "Confirming..." : "Confirm order and deduct stock"}
      </button>
      <Msg state={state} />
    </form>
  );
}

export function AdvanceForm({ orderId, to, label }: { orderId: string; to: string; label: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(advanceStatusAction, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="to" value={to} />
      <button type="submit" disabled={pending} className={gold}>
        {pending ? "Saving..." : label}
      </button>
      <Msg state={state} />
    </form>
  );
}

export function CancelForm({ orderId, canRestock }: { orderId: string; canRestock: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(cancelOrderAction, {});
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm("Cancel this order? This cannot be undone.")) e.preventDefault();
      }}
      className="grid gap-3"
    >
      <input type="hidden" name="orderId" value={orderId} />
      <div>
        <label htmlFor="reason" className="mb-1 block text-sm font-semibold">
          Reason for cancelling
        </label>
        <input id="reason" name="reason" required maxLength={500} className={`${field} w-full`} />
      </div>
      {canRestock && (
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="restock" defaultChecked className="h-4 w-4" />
          Goods are still in the shop: return them to stock
        </label>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-danger px-6 py-2.5 font-semibold text-danger hover:bg-danger hover:text-background disabled:opacity-60"
        >
          {pending ? "Cancelling..." : "Cancel order"}
        </button>
        <Msg state={state} />
      </div>
    </form>
  );
}
"use client";

import { useActionState, useEffect, useRef } from "react";
import { adjustStockAction } from "@/modules/inventory/actions";
import type { FormState } from "@/modules/categories/types";

const field = "w-full rounded-xl border border-line bg-background px-3 py-2.5";
const label = "mb-1 block text-sm font-semibold";

export default function StockForm({
  productId,
  unitCode,
  requestId,
}: {
  productId: string;
  unitCode: string;
  requestId: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    adjustStockAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="requestId" value={requestId} />

      <div>
        <label htmlFor="kind" className={label}>Type of change</label>
        <select id="kind" name="kind" defaultValue="restock" className={field}>
          <option value="restock">Restock (goods received)</option>
          <option value="return">Customer return (adds stock)</option>
          <option value="add">Correction: add</option>
          <option value="remove">Correction: remove (damage, loss)</option>
        </select>
      </div>

      <div>
        <label htmlFor="quantity" className={label}>Quantity ({unitCode})</label>
        <input id="quantity" name="quantity" inputMode="decimal" required className={field} />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="reason" className={label}>
          Reason (required except for restock)
        </label>
        <input id="reason" name="reason" maxLength={500} className={field} />
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-gold px-7 py-3 font-bold text-background hover:bg-gold-light disabled:opacity-60"
        >
          {pending ? "Saving..." : "Record change"}
        </button>
        <p role="status" aria-live="polite" className="text-sm">
          {state.error && <span className="text-danger">{state.error}</span>}
          {state.success && <span className="text-gold-light">{state.success}</span>}
        </p>
      </div>
    </form>
  );
}
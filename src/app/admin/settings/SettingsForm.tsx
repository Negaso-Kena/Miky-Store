"use client";

import { useActionState } from "react";
import { updateSettingsAction } from "@/modules/settings/actions";
import type { FormState } from "@/modules/categories/types";

type Values = {
  storeName: string;
  phone: string;
  whatsapp: string;
  telegram: string;
  shopAddress: string;
  deliveryCoverage: string;
};

const field = "w-full rounded-xl border border-line bg-background px-3 py-2.5";
const label = "mb-1 block text-sm font-semibold";

export default function SettingsForm({ values }: { values: Values }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateSettingsAction, {});

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="storeName" className={label}>Store name</label>
        <input id="storeName" name="storeName" required defaultValue={values.storeName} className={field} />
      </div>
      <div>
        <label htmlFor="phone" className={label}>Telephone (for calls)</label>
        <input id="phone" name="phone" inputMode="tel" placeholder="+251911223344" defaultValue={values.phone} className={field} />
      </div>
      <div>
        <label htmlFor="whatsapp" className={label}>WhatsApp number</label>
        <input id="whatsapp" name="whatsapp" inputMode="tel" placeholder="+251911223344" defaultValue={values.whatsapp} className={field} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="telegram" className={label}>Telegram username</label>
        <input id="telegram" name="telegram" placeholder="mikyshop" defaultValue={values.telegram} className={field} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="shopAddress" className={label}>Shop address and pickup instructions</label>
        <textarea id="shopAddress" name="shopAddress" rows={3} defaultValue={values.shopAddress} className={field} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="deliveryCoverage" className={label}>Delivery areas</label>
        <textarea id="deliveryCoverage" name="deliveryCoverage" rows={3} defaultValue={values.deliveryCoverage} className={field} />
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={pending} className="rounded-full bg-gold px-7 py-3 font-bold text-background hover:bg-gold-light disabled:opacity-60">
          {pending ? "Saving..." : "Save settings"}
        </button>
        <p role="status" aria-live="polite" className="text-sm">
          {state.error && <span className="text-danger">{state.error}</span>}
          {state.success && <span className="text-gold-light">{state.success}</span>}
        </p>
      </div>
    </form>
  );
}
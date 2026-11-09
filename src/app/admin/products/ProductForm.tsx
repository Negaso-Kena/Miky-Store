"use client";

import { useActionState } from "react";
import {
  createProductAction,
  updateProductAction,
} from "@/modules/products/actions";
import { UNITS } from "@/modules/products/units";
import type { FormState } from "@/modules/categories/types";

type Props = {
  categories: { id: string; name: string }[];
  product?: {
    id: string;
    name: string;
    sku: string;
    categoryId: string;
    price: string;
    unitCode: string;
    description: string;
    specs: string;
    publicationStatus: string;
    isAvailableForSale: boolean;
  };
};

const field = "w-full rounded-xl border border-line bg-background px-3 py-2.5";
const label = "mb-1 block text-sm font-semibold";

export default function ProductForm({ categories, product }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    product ? updateProductAction : createProductAction,
    {},
  );

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="sm:col-span-2">
        <label htmlFor="name" className={label}>Product name</label>
        <input id="name" name="name" required defaultValue={product?.name} className={field} />
      </div>

      <div>
        <label htmlFor="sku" className={label}>SKU (product code)</label>
        <input id="sku" name="sku" required defaultValue={product?.sku} className={field} />
      </div>

      <div>
        <label htmlFor="categoryId" className={label}>Category</label>
        <select id="categoryId" name="categoryId" required defaultValue={product?.categoryId ?? ""} className={field}>
          <option value="" disabled>Choose...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="price" className={label}>Price (ETB)</label>
        <input id="price" name="price" inputMode="decimal" required defaultValue={product?.price} className={field} />
      </div>

      <div>
        <label htmlFor="unitCode" className={label}>Sold by</label>
        {product ? (
          <>
            <input id="unitCode" value={product.unitCode} disabled className={`${field} opacity-60`} />
            <p className="mt-1 text-xs text-muted">The unit cannot change after creation.</p>
          </>
        ) : (
          <select id="unitCode" name="unitCode" defaultValue="piece" className={field}>
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        )}
      </div>

      {!product && (
        <div>
          <label htmlFor="openingStock" className={label}>Opening stock</label>
          <input id="openingStock" name="openingStock" inputMode="decimal" defaultValue="0" className={field} />
        </div>
      )}

      <div>
        <label htmlFor="publicationStatus" className={label}>Status</label>
        <select id="publicationStatus" name="publicationStatus" defaultValue={product?.publicationStatus ?? "DRAFT"} className={field}>
          <option value="DRAFT">Draft (hidden)</option>
          <option value="PUBLISHED">Published (visible)</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold">
        <input type="checkbox" name="isAvailableForSale" defaultChecked={product?.isAvailableForSale ?? true} className="h-4 w-4" />
        Available for sale
      </label>

      <div className="sm:col-span-2">
        <label htmlFor="description" className={label}>Description</label>
        <textarea id="description" name="description" rows={4} defaultValue={product?.description} className={field} />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="specs" className={label}>Specifications (one per line, like &quot;Power: 500 W&quot;)</label>
        <textarea id="specs" name="specs" rows={5} defaultValue={product?.specs} className={`${field} font-mono text-sm`} />
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-gold px-7 py-3 font-bold text-background hover:bg-gold-light disabled:opacity-60"
        >
          {pending ? "Saving..." : product ? "Save changes" : "Create product"}
        </button>
        <p role="status" aria-live="polite" className="text-sm">
          {state.error && <span className="text-danger">{state.error}</span>}
          {state.success && <span className="text-gold-light">{state.success}</span>}
        </p>
      </div>
    </form>
  );
}
"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createCategoryAction,
  updateCategoryAction,
} from "@/modules/categories/actions";
import type { FormState } from "@/modules/categories/types";

type Props = {
  category?: {
    id: string;
    name: string;
    description: string | null;
    sortOrder: number;
    isActive: boolean;
  };
};

const input =
  "w-full rounded-xl border border-line bg-background px-3 py-2.5";

export default function CategoryForm({ category }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    category ? updateCategoryAction : createCategoryAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!category && state.success) formRef.current?.reset();
  }, [state, category]);

  const p = category ? category.id : "new";

  return (
    <form ref={formRef} action={action} className="grid gap-3 sm:grid-cols-2">
      {category && <input type="hidden" name="id" value={category.id} />}

      <div>
        <label htmlFor={`name-${p}`} className="mb-1 block text-sm font-semibold">
          Name
        </label>
        <input id={`name-${p}`} name="name" required defaultValue={category?.name} className={input} />
      </div>

      <div>
        <label htmlFor={`order-${p}`} className="mb-1 block text-sm font-semibold">
          Display order
        </label>
        <input
          id={`order-${p}`}
          name="sortOrder"
          type="number"
          min={0}
          defaultValue={category?.sortOrder ?? 0}
          className={input}
        />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor={`desc-${p}`} className="mb-1 block text-sm font-semibold">
          Description (optional)
        </label>
        <textarea
          id={`desc-${p}`}
          name="description"
          rows={2}
          defaultValue={category?.description ?? ""}
          className={input}
        />
      </div>

      {category && (
        <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
          <input type="checkbox" name="isActive" defaultChecked={category.isActive} className="h-4 w-4" />
          Active (visible on the store)
        </label>
      )}

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-gold px-6 py-2.5 font-bold text-background hover:bg-gold-light disabled:opacity-60"
        >
          {pending ? "Saving..." : category ? "Save changes" : "Add category"}
        </button>
        <p role="status" aria-live="polite" className="text-sm">
          {state.error && <span className="text-danger">{state.error}</span>}
          {state.success && <span className="text-gold-light">{state.success}</span>}
        </p>
      </div>
    </form>
  );
}
"use server";

import { resolveCart } from "./resolve";
import { cartItemsSchema } from "./schema";
import type { CartSummary } from "./types";

export async function getCartLinesAction(raw: unknown): Promise<CartSummary> {
  const parsed = cartItemsSchema.safeParse(raw);
  if (!parsed.success) return { lines: [], subtotal: "0.00", allOk: false };
  const { lines, subtotal, allOk } = await resolveCart(parsed.data);
  return { lines, subtotal, allOk };
}
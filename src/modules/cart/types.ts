export const QUANTITY_RE = /^\d{1,9}(\.\d{1,3})?$/;

export type CartItem = { productId: string; quantity: string };

export type LineStatus = "ok" | "unavailable" | "invalid" | "insufficient";

export type CartLine = {
  productId: string;
  name: string;
  slug: string;
  sku: string;
  unitCode: string;
  price: string;
  quantity: string;
  lineTotal: string;
  status: LineStatus;
};

export type CartSummary = { lines: CartLine[]; subtotal: string; allOk: boolean };
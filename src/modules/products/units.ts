export const UNITS = ["piece", "pair", "set", "meter"] as const;
export type UnitCode = (typeof UNITS)[number];

export const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export function isValidQuantity(unit: string, q: string): boolean {
  if (!(Number(q) > 0)) return false;
  return unit === "meter"
    ? /^\d{1,9}(\.\d{1,3})?$/.test(q)
    : /^\d{1,9}$/.test(q);
}
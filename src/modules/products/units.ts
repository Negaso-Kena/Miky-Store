export const UNITS = ["piece", "pair", "set", "meter"] as const;
export type UnitCode = (typeof UNITS)[number];

export const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
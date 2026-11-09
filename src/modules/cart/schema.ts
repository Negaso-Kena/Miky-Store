import { z } from "zod";
import { QUANTITY_RE } from "./types";

export const cartItemsSchema = z
  .array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.string().regex(QUANTITY_RE),
    }),
  )
  .min(1)
  .max(50);
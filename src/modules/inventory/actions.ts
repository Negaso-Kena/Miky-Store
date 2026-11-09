"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/security/session";
import type { FormState } from "@/modules/categories/types";
import { isValidQuantity } from "@/modules/products/units";

const KINDS = {
  restock: { type: "RESTOCK", sign: 1, reasonRequired: false },
  return: { type: "RETURN", sign: 1, reasonRequired: true },
  add: { type: "ADJUSTMENT", sign: 1, reasonRequired: true },
  remove: { type: "ADJUSTMENT", sign: -1, reasonRequired: true },
} as const;

const schema = z.object({
  productId: z.string().uuid(),
  kind: z.enum(["restock", "return", "add", "remove"]),
  quantity: z.string().trim(),
  reason: z.string().trim().max(500, "Reason is too long (500 characters max)."),
  requestId: z.string().uuid(),
});

export async function adjustStockAction(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const { admin } = await requireAdmin();

  const parsed = schema.safeParse({
    productId: fd.get("productId"),
    kind: fd.get("kind"),
    quantity: fd.get("quantity") ?? "",
    reason: fd.get("reason") ?? "",
    requestId: fd.get("requestId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const kind = KINDS[d.kind];

  const product = await db.product.findUnique({ where: { id: d.productId } });
  if (!product) return { error: "Product not found." };

  if (!isValidQuantity(product.unitCode, d.quantity)) {
    return {
      error:
        product.unitCode === "meter"
          ? "Quantity must be more than 0, with up to 3 decimals."
          : `Quantity must be a whole number more than 0 (sold by ${product.unitCode}).`,
    };
  }
  if (kind.reasonRequired && d.reason.length < 3) {
    return { error: "Please give a reason for this change." };
  }

  const change = kind.sign === 1 ? d.quantity : `-${d.quantity}`;

  try {
    const result = await db.$transaction(async (tx) => {
      if (kind.sign === 1) {
        await tx.inventory.update({
          where: { productId: d.productId },
          data: { quantityOnHand: { increment: d.quantity } },
        });
      } else {
        // Only succeeds if enough stock is there at this exact moment.
        const r = await tx.inventory.updateMany({
          where: { productId: d.productId, quantityOnHand: { gte: d.quantity } },
          data: { quantityOnHand: { decrement: d.quantity } },
        });
        if (r.count === 0) return { insufficient: true as const };
      }

      const inv = await tx.inventory.findUniqueOrThrow({
        where: { productId: d.productId },
      });
      const after = inv.quantityOnHand;
      const before = after.minus(change);

      await tx.inventoryMovement.create({
        data: {
          productId: d.productId,
          adminUserId: admin.id,
          movementType: kind.type,
          quantityChange: change,
          quantityBefore: before,
          quantityAfter: after,
          reason: d.reason || null,
          idempotencyKey: `manual:${d.requestId}`,
        },
      });

      await tx.auditLog.create({
        data: {
          adminUserId: admin.id,
          action: "STOCK_ADJUSTED",
          entityType: "Product",
          entityId: d.productId,
          metadata: { kind: d.kind, change, after: after.toString() },
        },
      });

      return { insufficient: false as const, after: after.toString() };
    });

    if (result.insufficient) {
      return { error: "Not enough stock to remove that quantity." };
    }

    revalidatePath("/admin/inventory");
    revalidatePath(`/admin/inventory/${d.productId}`);
    return {
      success: `Stock updated. New quantity: ${result.after} ${product.unitCode}.`,
    };
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === "P2002") return { success: "This change was already recorded." };
    if (code === "P2025") return { error: "This product has no stock record." };
    throw e;
  }
}
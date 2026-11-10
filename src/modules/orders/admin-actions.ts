"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/security/session";
import type { FormState } from "@/modules/categories/types";
import {
  advanceOptions,
  CANCELLABLE,
  ORDER_STATUSES,
  type MethodValue,
  type OrderStatusValue,
} from "./transitions";

// Thrown inside a transaction to roll everything back with a readable message.
class Abort extends Error {}

const orderIdSchema = z.string().uuid();

function refresh(orderId: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
}

export async function setDeliveryFeeAction(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const { admin } = await requireAdmin();

  const id = orderIdSchema.safeParse(fd.get("orderId"));
  if (!id.success) return { error: "Invalid order." };

  const feeText = String(fd.get("fee") ?? "").trim();
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(feeText)) {
    return { error: "Enter a fee like 150 or 150.50 (use 0 for free delivery)." };
  }

  const order = await db.order.findUnique({ where: { id: id.data } });
  if (!order) return { error: "Order not found." };
  if (order.fulfillmentMethod !== "DELIVERY") return { error: "This is a pickup order." };
  if (order.status !== "PENDING") {
    return { error: "The delivery fee can only be changed while the order is pending." };
  }

  const fee = new Prisma.Decimal(feeText);
  const total = order.subtotal.plus(fee);

  const r = await db.order.updateMany({
    where: { id: order.id, status: "PENDING", fulfillmentMethod: "DELIVERY" },
    data: { deliveryFee: fee, total },
  });
  if (r.count === 0) return { error: "The order changed. Reload the page." };

  await db.auditLog.create({
    data: {
      adminUserId: admin.id,
      action: "DELIVERY_FEE_SET",
      entityType: "Order",
      entityId: order.id,
      metadata: { fee: feeText, total: total.toFixed(2) },
    },
  });

  refresh(order.id);
  return { success: `Delivery fee saved. Total: ETB ${total.toFixed(2)}.` };
}

export async function confirmOrderAction(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const { admin } = await requireAdmin();

  const id = orderIdSchema.safeParse(fd.get("orderId"));
  if (!id.success) return { error: "Invalid order." };
  const orderId = id.data;

  try {
    const orderNumber = await db.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });
        if (!order) throw new Abort("Order not found.");
        if (order.status !== "PENDING") {
          throw new Abort("This order is no longer pending. Reload the page.");
        }
        if (order.fulfillmentMethod === "DELIVERY" && order.deliveryFee === null) {
          throw new Abort("Enter the delivery fee before confirming this order.");
        }
        if (order.items.length === 0) throw new Abort("This order has no items.");
        if (order.items.some((i) => !i.productId)) {
          throw new Abort("An item's product no longer exists. Cancel this order instead.");
        }

        // Claim the order first. If another admin already changed it, this matches 0 rows.
        const claimed = await tx.order.updateMany({
          where: { id: orderId, status: "PENDING" },
          data: { status: "CONFIRMED", inventoryDeductedAt: new Date() },
        });
        if (claimed.count === 0) {
          throw new Abort("Someone else just changed this order. Reload the page.");
        }

        // Fixed product order, so two orders never wait on each other in a loop.
        const items = [...order.items].sort((a, b) =>
          a.productId!.localeCompare(b.productId!),
        );

        for (const item of items) {
          const productId = item.productId!;
          // Only deducts if enough stock exists at this exact moment.
          const deducted = await tx.inventory.updateMany({
            where: { productId, quantityOnHand: { gte: item.quantity } },
            data: { quantityOnHand: { decrement: item.quantity } },
          });
          if (deducted.count === 0) {
            throw new Abort(
              `Not enough stock for "${item.productName}". Nothing was changed. Adjust the stock or cancel the order.`,
            );
          }

          const inv = await tx.inventory.findUniqueOrThrow({ where: { productId } });
          await tx.inventoryMovement.create({
            data: {
              productId,
              adminUserId: admin.id,
              orderId,
              movementType: "SALE",
              quantityChange: item.quantity.neg(),
              quantityBefore: inv.quantityOnHand.plus(item.quantity),
              quantityAfter: inv.quantityOnHand,
              reason: `Order ${order.orderNumber} confirmed`,
              idempotencyKey: `order-confirm:${orderId}:${productId}`,
            },
          });
        }

        await tx.orderStatusHistory.create({
          data: {
            orderId,
            changedByAdminId: admin.id,
            previousStatus: "PENDING",
            newStatus: "CONFIRMED",
            reason: "Confirmed; stock deducted",
          },
        });
        await tx.auditLog.create({
          data: {
            adminUserId: admin.id,
            action: "ORDER_CONFIRMED",
            entityType: "Order",
            entityId: orderId,
            metadata: { orderNumber: order.orderNumber },
          },
        });

        return order.orderNumber;
      },
      { timeout: 15000 },
    );

    refresh(orderId);
    revalidatePath("/admin/inventory");
    return { success: `Order ${orderNumber} confirmed and stock deducted.` };
  } catch (e) {
    if (e instanceof Abort) return { error: e.message };
    if ((e as { code?: string })?.code === "P2002") {
      return { error: "This order was already processed. Reload the page." };
    }
    throw e;
  }
}

export async function advanceStatusAction(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const { admin } = await requireAdmin();

  const id = orderIdSchema.safeParse(fd.get("orderId"));
  const to = z.enum(ORDER_STATUSES).safeParse(fd.get("to"));
  if (!id.success || !to.success) return { error: "Invalid request." };

  const order = await db.order.findUnique({ where: { id: id.data } });
  if (!order) return { error: "Order not found." };

  const allowed = advanceOptions(
    order.status as OrderStatusValue,
    order.fulfillmentMethod as MethodValue,
  );
  if (!allowed.includes(to.data)) {
    return { error: "That status change is not allowed for this order." };
  }

  const r = await db.order.updateMany({
    where: { id: order.id, status: order.status },
    data: { status: to.data },
  });
  if (r.count === 0) return { error: "The order changed. Reload the page." };

  await db.orderStatusHistory.create({
    data: {
      orderId: order.id,
      changedByAdminId: admin.id,
      previousStatus: order.status,
      newStatus: to.data,
    },
  });
  await db.auditLog.create({
    data: {
      adminUserId: admin.id,
      action: "ORDER_STATUS_CHANGED",
      entityType: "Order",
      entityId: order.id,
      metadata: { from: order.status, to: to.data },
    },
  });

  refresh(order.id);
  return { success: "Status updated." };
}

export async function cancelOrderAction(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const { admin } = await requireAdmin();

  const id = orderIdSchema.safeParse(fd.get("orderId"));
  const reason = z.string().trim().min(3, "Please give a reason.").max(500).safeParse(
    fd.get("reason") ?? "",
  );
  if (!id.success) return { error: "Invalid order." };
  if (!reason.success) return { error: reason.error.issues[0].message };
  const restockChecked = fd.get("restock") === "on";
  const orderId = id.data;

  try {
    const restocked = await db.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });
        if (!order) throw new Abort("Order not found.");
        if (!CANCELLABLE.includes(order.status as OrderStatusValue)) {
          throw new Abort(
            "This order can no longer be cancelled here. Orders out for delivery or completed need a return record.",
          );
        }

        const hasDeducted =
          order.inventoryDeductedAt !== null && order.inventoryRestoredAt === null;
        const restock = hasDeducted && restockChecked;

        const claimed = await tx.order.updateMany({
          where: { id: orderId, status: order.status },
          data: {
            status: "CANCELLED",
            ...(restock ? { inventoryRestoredAt: new Date() } : {}),
          },
        });
        if (claimed.count === 0) {
          throw new Abort("Someone else just changed this order. Reload the page.");
        }

        if (restock) {
          const items = [...order.items]
            .filter((i) => i.productId)
            .sort((a, b) => a.productId!.localeCompare(b.productId!));
          for (const item of items) {
            const productId = item.productId!;
            const inv = await tx.inventory.update({
              where: { productId },
              data: { quantityOnHand: { increment: item.quantity } },
            });
            await tx.inventoryMovement.create({
              data: {
                productId,
                adminUserId: admin.id,
                orderId,
                movementType: "CANCELLATION_RESTOCK",
                quantityChange: item.quantity,
                quantityBefore: inv.quantityOnHand.minus(item.quantity),
                quantityAfter: inv.quantityOnHand,
                reason: `Order ${order.orderNumber} cancelled`,
                idempotencyKey: `order-cancel:${orderId}:${productId}`,
              },
            });
          }
        }

        await tx.orderStatusHistory.create({
          data: {
            orderId,
            changedByAdminId: admin.id,
            previousStatus: order.status,
            newStatus: "CANCELLED",
            reason: reason.data,
          },
        });
        await tx.auditLog.create({
          data: {
            adminUserId: admin.id,
            action: "ORDER_CANCELLED",
            entityType: "Order",
            entityId: orderId,
            metadata: { from: order.status, restocked: restock },
          },
        });

        return restock;
      },
      { timeout: 15000 },
    );

    refresh(orderId);
    revalidatePath("/admin/inventory");
    return {
      success: restocked ? "Order cancelled and stock restored." : "Order cancelled.",
    };
  } catch (e) {
    if (e instanceof Abort) return { error: e.message };
    const code = (e as { code?: string })?.code;
    if (code === "P2002") return { error: "Stock for this order was already restored." };
    if (code === "P2025") return { error: "A product in this order has no stock record." };
    throw e;
  }
}
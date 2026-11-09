"use server";

import { randomInt } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { normalizePhone } from "@/lib/phone";
import { allowAction } from "@/lib/security/rate-limit";
import { resolveCart } from "@/modules/cart/resolve";
import { cartItemsSchema } from "@/modules/cart/schema";
import type { FormState } from "@/modules/categories/types";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeOrderNumber() {
  const part = () =>
    Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `MK-${part()}-${part()}`;
}

const formSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(120),
  phone: z.string().trim().max(30),
  method: z.enum(["PICKUP", "DELIVERY"]),
  address: z.string().trim().max(500),
  note: z.string().trim().max(1000),
  submissionKey: z.string().uuid(),
  cart: z.string().max(20000),
  website: z.string().max(0),
});

export async function placeOrderAction(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const s = (k: string) => String(fd.get(k) ?? "");
  const parsed = formSchema.safeParse({
    name: s("name"),
    phone: s("phone"),
    method: s("method"),
    address: s("address"),
    note: s("note"),
    submissionKey: s("submissionKey"),
    cart: s("cart"),
    website: s("website"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const d = parsed.data;

  const phone = normalizePhone(d.phone);
  if (!phone) return { error: "Enter a valid telephone number, like 0911223344." };
  if (d.method === "DELIVERY" && d.address.length < 8) {
    return { error: "Enter your delivery address (at least 8 characters)." };
  }

  let cartRaw: unknown;
  try {
    cartRaw = JSON.parse(d.cart);
  } catch {
    return { error: "Your cart could not be read. Reload the page and try again." };
  }
  const cart = cartItemsSchema.safeParse(cartRaw);
  if (!cart.success) return { error: "Your cart is empty or invalid." };

  // Same submission sent twice: show the order that already exists.
  const existing = await db.order.findUnique({
    where: { submissionKey: d.submissionKey },
    select: { orderNumber: true },
  });
  if (existing) redirect(`/checkout/done?ref=${existing.orderNumber}`);

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allowAction(`order:${ip}`, 10, 60 * 60 * 1000)) {
    return { error: "Too many orders from this device. Please try again later." };
  }

  const resolved = await resolveCart(cart.data);
  if (!resolved.allOk) {
    return {
      error:
        "Some items are unavailable or more than we have in stock. Please review your cart.",
    };
  }

  const isPickup = d.method === "PICKUP";
  let orderNumber: string | null = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = makeOrderNumber();
    try {
      await db.order.create({
        data: {
          orderNumber: candidate,
          customerName: d.name,
          customerPhone: phone,
          fulfillmentMethod: d.method,
          deliveryAddress: isPickup ? null : d.address,
          subtotal: resolved.subtotal,
          deliveryFee: isPickup ? "0" : null,
          total: isPickup ? resolved.subtotal : null,
          customerNote: d.note || null,
          submissionKey: d.submissionKey,
          items: {
            create: resolved.entries.flatMap((e) =>
              e.product
                ? [
                    {
                      productId: e.product.id,
                      productName: e.product.name,
                      sku: e.product.sku,
                      unitCode: e.product.unitCode,
                      unitPrice: e.product.price,
                      quantity: e.quantity,
                      lineTotal: e.product.price.mul(e.quantity).toDecimalPlaces(2),
                    },
                  ]
                : [],
            ),
          },
          statusHistory: {
            create: { previousStatus: null, newStatus: "PENDING", reason: "Order submitted" },
          },
        },
      });
      orderNumber = candidate;
      break;
    } catch (e) {
      if ((e as { code?: string })?.code !== "P2002") throw e;
      // Either a double submit or an order-number clash.
      const dup = await db.order.findUnique({
        where: { submissionKey: d.submissionKey },
        select: { orderNumber: true },
      });
      if (dup) {
        orderNumber = dup.orderNumber;
        break;
      }
    }
  }

  if (!orderNumber) return { error: "Could not create the order. Please try again." };
  redirect(`/checkout/done?ref=${orderNumber}`);
}
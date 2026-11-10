"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db/client";
import { normalizePhone, phoneMatchKey } from "@/lib/phone";
import {
  allowAction,
  clearFailures,
  isBlocked,
  recordFailure,
} from "@/lib/security/rate-limit";
import { describeStatus, type TrackState } from "./track";

// Order references look like MK-7K3Q-9DXA.
const REF_RE = /^MK-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

// One message for every failure, so nobody can use this page to learn
// which order references exist.
const NOT_FOUND =
  "We could not find an order with those details. Check the reference and the telephone number you used.";
const TOO_MANY = "Too many attempts. Please try again in 15 minutes.";

const FIFTEEN_MIN = 15 * 60 * 1000;

// Shown to customers in Ethiopian time.
const when = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Addis_Ababa",
});

export async function trackOrderAction(
  _prev: TrackState,
  fd: FormData,
): Promise<TrackState> {
  const ref = String(fd.get("ref") ?? "").trim().toUpperCase();
  const phoneInput = String(fd.get("phone") ?? "");

  // Limit 1: how many lookups one visitor may make.
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allowAction(`track-ip:${ip}`, 20, FIFTEEN_MIN)) return { error: TOO_MANY };

  // Limit 2: stop anyone guessing phone numbers against one reference.
  const refKey = `track-ref:${ref}`;
  if (isBlocked(refKey)) return { error: TOO_MANY };

  // Reject badly formatted input early, with the same generic message.
  const phone = normalizePhone(phoneInput);
  if (!REF_RE.test(ref) || !phone) return { error: NOT_FOUND };

  // Select ONLY the fields a customer may see. Address, note and
  // admin data are never loaded, so they cannot leak by mistake.
  const order = await db.order.findUnique({
    where: { orderNumber: ref },
    select: {
      orderNumber: true,
      status: true,
      fulfillmentMethod: true,
      customerPhone: true,
      createdAt: true,
      subtotal: true,
      deliveryFee: true,
      total: true,
      items: {
        orderBy: { productName: "asc" },
        select: { productName: true, quantity: true, unitCode: true, lineTotal: true },
      },
    },
  });

  // Phones are compared by their last 9 digits, so 0911223344 and
  // +251911223344 count as the same number.
  if (!order || phoneMatchKey(order.customerPhone) !== phoneMatchKey(phone)) {
    recordFailure(refKey); // counts toward the 5-failure block
    return { error: NOT_FOUND };
  }

  clearFailures(refKey);

  const { label, message } = describeStatus(order.status, order.fulfillmentMethod);

  return {
    order: {
      reference: order.orderNumber,
      status: order.status,
      statusLabel: label,
      statusMessage: message,
      method: order.fulfillmentMethod,
      placedAt: when.format(order.createdAt),
      items: order.items.map((i) => ({
        name: i.productName,
        quantity: i.quantity.toString(),
        unit: i.unitCode,
        lineTotal: i.lineTotal.toFixed(2),
      })),
      subtotal: order.subtotal.toFixed(2),
      deliveryFee: order.deliveryFee === null ? null : order.deliveryFee.toFixed(2),
      total: order.total === null ? null : order.total.toFixed(2),
    },
  };
}
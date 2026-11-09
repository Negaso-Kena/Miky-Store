import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db/client";
import { isValidQuantity } from "@/modules/products/units";
import type { CartItem, CartLine, LineStatus } from "./types";

export type ResolvedEntry = {
  line: CartLine;
  product: { id: string; name: string; sku: string; unitCode: string; price: Prisma.Decimal } | null;
  quantity: Prisma.Decimal;
};

export async function resolveCart(items: CartItem[]) {
  const merged = new Map<string, Prisma.Decimal>();
  for (const item of items) {
    const q = new Prisma.Decimal(item.quantity);
    merged.set(item.productId, (merged.get(item.productId) ?? new Prisma.Decimal(0)).plus(q));
  }

  const products = await db.product.findMany({
    where: { id: { in: [...merged.keys()] } },
    include: {
      category: { select: { isActive: true } },
      inventory: { select: { quantityOnHand: true } },
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const entries: ResolvedEntry[] = [];
  let subtotal = new Prisma.Decimal(0);

  for (const [productId, quantity] of merged) {
    const p = byId.get(productId);
    if (!p) {
      entries.push({
        product: null,
        quantity,
        line: {
          productId, name: "Product no longer available", slug: "", sku: "",
          unitCode: "piece", price: "0.00", quantity: quantity.toString(),
          lineTotal: "0.00", status: "unavailable",
        },
      });
      continue;
    }

    const visible =
      p.publicationStatus === "PUBLISHED" && p.category.isActive && p.isAvailableForSale;
    let status: LineStatus = "ok";
    if (!visible) status = "unavailable";
    else if (!isValidQuantity(p.unitCode, quantity.toString())) status = "invalid";
    else if (quantity.gt(p.inventory?.quantityOnHand ?? 0)) status = "insufficient";

    const lineTotal = p.price.mul(quantity).toDecimalPlaces(2);
    if (status === "ok") subtotal = subtotal.plus(lineTotal);

    entries.push({
      quantity,
      product: { id: p.id, name: p.name, sku: p.sku, unitCode: p.unitCode, price: p.price },
      line: {
        productId, name: p.name, slug: p.slug, sku: p.sku, unitCode: p.unitCode,
        price: p.price.toFixed(2), quantity: quantity.toString(),
        lineTotal: lineTotal.toFixed(2), status,
      },
    });
  }

  return {
    entries,
    lines: entries.map((e) => e.line),
    subtotal: subtotal.toFixed(2),
    allOk: entries.length > 0 && entries.every((e) => e.line.status === "ok"),
  };
}
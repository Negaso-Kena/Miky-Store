"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/security/session";
import { slugify } from "@/lib/slug";
import type { FormState } from "@/modules/categories/types";
import { STATUSES, UNITS } from "./units";

const baseSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(180),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[A-Z0-9][A-Z0-9._-]{1,79}$/,
      "SKU: 2 to 80 letters, numbers, dots, dashes or underscores.",
    ),
  categoryId: z.string().uuid("Choose a category."),
  price: z
    .string()
    .trim()
    .regex(/^\d{1,10}(\.\d{1,2})?$/, "Enter a price like 1250 or 1250.50.")
    .refine((v) => Number(v) > 0, "Price must be more than 0."),
  description: z.string().trim().max(5000),
  specs: z.string().max(6000),
  publicationStatus: z.enum(STATUSES),
});

function readBase(fd: FormData) {
  const s = (k: string) => String(fd.get(k) ?? "");
  return {
    name: s("name"),
    sku: s("sku"),
    categoryId: s("categoryId"),
    price: s("price"),
    description: s("description"),
    specs: s("specs"),
    publicationStatus: s("publicationStatus"),
  };
}

function parseSpecs(text: string): { specs: { name: string; value: string }[] } | { error: string } {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 30) return { error: "At most 30 specifications." };
  const specs: { name: string; value: string }[] = [];
  for (const line of lines) {
    const i = line.indexOf(":");
    const name = i > 0 ? line.slice(0, i).trim() : "";
    const value = i > 0 ? line.slice(i + 1).trim() : "";
    if (!name || !value || name.length > 100 || value.length > 500) {
      return { error: `Specification "${line.slice(0, 40)}" must look like "Power: 500 W".` };
    }
    specs.push({ name, value });
  }
  return { specs };
}

const quantityOk = (unit: string, q: string) =>
  unit === "meter" ? /^\d{1,9}(\.\d{1,3})?$/.test(q) : /^\d{1,9}$/.test(q);

async function uniqueSlug(name: string) {
  const base = slugify(name) || "product";
  for (let i = 1; i < 50; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    if (!(await db.product.findUnique({ where: { slug } }))) return slug;
  }
  throw new Error("Could not generate a unique slug");
}

async function checkCategory(categoryId: string): Promise<string | null> {
  const c = await db.category.findUnique({ where: { id: categoryId } });
  if (!c) return "Category not found.";
  if (!c.isActive) return "That category is inactive. Choose an active one.";
  return null;
}

export async function createProductAction(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const { admin } = await requireAdmin();

  const parsed = baseSchema
    .extend({
      unitCode: z.enum(UNITS),
      openingStock: z.string().trim(),
    })
    .safeParse({
      ...readBase(fd),
      unitCode: String(fd.get("unitCode") ?? ""),
      openingStock: String(fd.get("openingStock") ?? "") || "0",
    });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  if (!quantityOk(d.unitCode, d.openingStock)) {
    return {
      error:
        d.unitCode === "meter"
          ? "Opening stock: up to 3 decimals, like 25 or 12.5."
          : "Opening stock must be a whole number for this unit.",
    };
  }
  const specResult = parseSpecs(d.specs);
  if ("error" in specResult) return { error: specResult.error };

  const catError = await checkCategory(d.categoryId);
  if (catError) return { error: catError };
  if (await db.product.findUnique({ where: { sku: d.sku } })) {
    return { error: "This SKU is already used by another product." };
  }

  const slug = await uniqueSlug(d.name);

  try {
    await db.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          name: d.name,
          slug,
          sku: d.sku,
          categoryId: d.categoryId,
          description: d.description || null,
          price: d.price,
          unitCode: d.unitCode,
          publicationStatus: d.publicationStatus,
          isAvailableForSale: fd.get("isAvailableForSale") === "on",
          specifications: {
            create: specResult.specs.map((s, i) => ({ ...s, sortOrder: i })),
          },
          inventory: { create: { quantityOnHand: d.openingStock } },
        },
      });

      if (Number(d.openingStock) > 0) {
        await tx.inventoryMovement.create({
          data: {
            productId: p.id,
            adminUserId: admin.id,
            movementType: "OPENING_STOCK",
            quantityChange: d.openingStock,
            quantityBefore: "0",
            quantityAfter: d.openingStock,
            reason: "Opening stock",
            idempotencyKey: `opening:${p.id}`,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          adminUserId: admin.id,
          action: "PRODUCT_CREATED",
          entityType: "Product",
          entityId: p.id,
          metadata: { sku: d.sku, price: d.price, status: d.publicationStatus },
        },
      });
    });
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") {
      return { error: "That SKU or web address is already in use. Try again." };
    }
    throw e;
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateProductAction(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const { admin } = await requireAdmin();

  const id = z.string().uuid().safeParse(fd.get("id"));
  if (!id.success) return { error: "Invalid product." };

  const parsed = baseSchema.safeParse(readBase(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const existing = await db.product.findUnique({ where: { id: id.data } });
  if (!existing) return { error: "Product not found." };

  const specResult = parseSpecs(d.specs);
  if ("error" in specResult) return { error: specResult.error };

  if (d.categoryId !== existing.categoryId || d.publicationStatus === "PUBLISHED") {
    const catError = await checkCategory(d.categoryId);
    if (catError) return { error: catError };
  }

  const skuOwner = await db.product.findUnique({ where: { sku: d.sku } });
  if (skuOwner && skuOwner.id !== existing.id) {
    return { error: "This SKU is already used by another product." };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: existing.id },
        data: {
          name: d.name,
          sku: d.sku,
          categoryId: d.categoryId,
          description: d.description || null,
          price: d.price,
          publicationStatus: d.publicationStatus,
          isAvailableForSale: fd.get("isAvailableForSale") === "on",
        },
      });
      await tx.productSpecification.deleteMany({ where: { productId: existing.id } });
      if (specResult.specs.length) {
        await tx.productSpecification.createMany({
          data: specResult.specs.map((s, i) => ({
            productId: existing.id,
            ...s,
            sortOrder: i,
          })),
        });
      }
      await tx.auditLog.create({
        data: {
          adminUserId: admin.id,
          action: "PRODUCT_UPDATED",
          entityType: "Product",
          entityId: existing.id,
          metadata: {
            oldPrice: existing.price.toString(),
            newPrice: d.price,
            oldStatus: existing.publicationStatus,
            newStatus: d.publicationStatus,
          },
        },
      });
    });
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") {
      return { error: "This SKU is already used by another product." };
    }
    throw e;
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${existing.id}`);
  return { success: "Saved." };
}
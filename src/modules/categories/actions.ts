"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/security/session";
import { slugify } from "@/lib/slug";
import type { FormState } from "./types";

const DEFAULT_CATEGORIES = [
  "Sound Systems and Speakers",
  "Amplifiers and Mixers",
  "Batteries and Power Equipment",
  "Voltage Regulators",
  "Cables and Audio Accessories",
  "Other Electronics",
];

const fieldsSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100),
  description: z.string().trim().max(1000),
  sortOrder: z.coerce.number().int().min(0).max(9999),
});

function parseFields(formData: FormData) {
  return fieldsSchema.safeParse({
    name: formData.get("name") ?? "",
    description: formData.get("description") ?? "",
    sortOrder: formData.get("sortOrder") || 0,
  });
}

const isUniqueError = (e: unknown) =>
  typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";

export async function createCategoryAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { admin } = await requireAdmin();

  const parsed = parseFields(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const slug = slugify(parsed.data.name);
  if (!slug) return { error: "Use letters or numbers in the name." };

  try {
    const category = await db.category.create({
      data: {
        name: parsed.data.name,
        slug,
        description: parsed.data.description || null,
        sortOrder: parsed.data.sortOrder,
      },
    });
    await db.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "CATEGORY_CREATED",
        entityType: "Category",
        entityId: category.id,
        metadata: { name: category.name },
      },
    });
  } catch (e) {
    if (isUniqueError(e)) return { error: "A category with this name already exists." };
    throw e;
  }

  revalidatePath("/admin/categories");
  return { success: "Category added." };
}

export async function updateCategoryAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { admin } = await requireAdmin();

  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return { error: "Invalid category." };

  const parsed = parseFields(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const isActive = formData.get("isActive") === "on";

  if (!isActive) {
    const published = await db.product.count({
      where: { categoryId: id.data, publicationStatus: "PUBLISHED" },
    });
    if (published > 0) {
      return {
        error: `${published} published product(s) use this category. Move or archive them first.`,
      };
    }
  }

  try {
    await db.category.update({
      where: { id: id.data },
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        sortOrder: parsed.data.sortOrder,
        isActive,
      },
    });
    await db.auditLog.create({
      data: {
        adminUserId: admin.id,
        action: "CATEGORY_UPDATED",
        entityType: "Category",
        entityId: id.data,
        metadata: { name: parsed.data.name, isActive },
      },
    });
  } catch (e) {
    if (isUniqueError(e)) return { error: "A category with this name already exists." };
    throw e;
  }

  revalidatePath("/admin/categories");
  return { success: "Saved." };
}

export async function seedDefaultCategoriesAction(): Promise<void> {
  const { admin } = await requireAdmin();

  if ((await db.category.count()) > 0) return;

  await db.category.createMany({
    data: DEFAULT_CATEGORIES.map((name, index) => ({
      name,
      slug: slugify(name),
      sortOrder: index,
    })),
  });
  await db.auditLog.create({
    data: {
      adminUserId: admin.id,
      action: "CATEGORIES_SEEDED",
      entityType: "Category",
      metadata: { count: DEFAULT_CATEGORIES.length },
    },
  });

  revalidatePath("/admin/categories");
}
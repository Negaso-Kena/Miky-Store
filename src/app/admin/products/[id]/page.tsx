import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import AdminNav from "@/components/admin/AdminNav";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/security/session";
import ProductForm from "../ProductForm";

export const metadata: Metadata = {
  title: "Edit product | Admin",
  robots: { index: false, follow: false },
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const [product, categories] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: { specifications: { orderBy: { sortOrder: "asc" } }, inventory: true },
    }),
    db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);
  if (!product) notFound();

  // The product's current category stays selectable even if it was deactivated.
  const current = await db.category.findUnique({
    where: { id: product.categoryId },
    select: { id: true, name: true },
  });
  const options =
    current && !categories.some((c) => c.id === current.id)
      ? [current, ...categories]
      : categories;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <AdminNav />
      <h1 className="font-display text-3xl font-bold text-gold">{product.name}</h1>
      <p className="mb-6 mt-1 text-sm text-muted">
        Stock on hand: {product.inventory?.quantityOnHand.toString() ?? "0"} {product.unitCode}
        . Stock changes will have their own screen so every change is recorded.
      </p>
      <div className="rounded-2xl border border-line bg-surface p-6">
        <ProductForm
          categories={options}
          product={{
            id: product.id,
            name: product.name,
            sku: product.sku,
            categoryId: product.categoryId,
            price: product.price.toString(),
            unitCode: product.unitCode,
            description: product.description ?? "",
            specs: product.specifications.map((s) => `${s.name}: ${s.value}`).join("\n"),
            publicationStatus: product.publicationStatus,
            isAvailableForSale: product.isAvailableForSale,
          }}
        />
      </div>
    </main>
  );
}
import type { Metadata } from "next";
import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/security/session";
import ProductForm from "../ProductForm";

export const metadata: Metadata = {
  title: "Add product | Admin",
  robots: { index: false, follow: false },
};

export default async function NewProductPage() {
  await requireAdmin();

  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <AdminNav />
      <h1 className="mb-6 font-display text-3xl font-bold text-gold">Add product</h1>
      {categories.length === 0 ? (
        <p className="text-muted">
          Create at least one active category first.{" "}
          <Link href="/admin/categories" className="text-gold-light underline">Go to categories</Link>
        </p>
      ) : (
        <div className="rounded-2xl border border-line bg-surface p-6">
          <ProductForm categories={categories} />
        </div>
      )}
    </main>
  );
}
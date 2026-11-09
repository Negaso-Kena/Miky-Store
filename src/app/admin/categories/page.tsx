import type { Metadata } from "next";
import AdminNav from "@/components/admin/AdminNav";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/security/session";
import { seedDefaultCategoriesAction } from "@/modules/categories/actions";
import CategoryForm from "./CategoryForm";

export const metadata: Metadata = {
  title: "Categories | Admin",
  robots: { index: false, follow: false },
};

export default async function CategoriesPage() {
  await requireAdmin();

  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <main className="mx-auto max-w-4xl p-6">
      <AdminNav />
      <h1 className="mb-6 font-display text-3xl font-bold text-gold">Categories</h1>

      {categories.length === 0 && (
        <form
          action={seedDefaultCategoriesAction}
          className="mb-8 rounded-2xl border border-dashed border-line p-6"
        >
          <p className="mb-3 text-muted">
            No categories yet. Create the six starting categories from the
            requirements document, or add your own below.
          </p>
          <button className="rounded-full border border-gold px-5 py-2 font-semibold text-gold hover:bg-gold hover:text-background">
            Create the 6 starting categories
          </button>
        </form>
      )}

      <section className="mb-8 rounded-2xl border border-line bg-surface p-6">
        <h2 className="mb-4 text-lg font-bold">Add a category</h2>
        <CategoryForm />
      </section>

      <section aria-label="Existing categories" className="space-y-3">
        {categories.map((c) => (
          <details key={c.id} className="rounded-2xl border border-line bg-surface p-4">
            <summary className="cursor-pointer font-semibold">
              {c.name}
              <span className={`ml-3 text-xs ${c.isActive ? "text-gold-light" : "text-muted"}`}>
                {c.isActive ? "Active" : "Inactive"}
              </span>
              <span className="ml-3 text-xs text-muted">/{c.slug}</span>
            </summary>
            <div className="mt-4 border-t border-line pt-4">
              <CategoryForm category={c} />
            </div>
          </details>
        ))}
      </section>
    </main>
  );
}
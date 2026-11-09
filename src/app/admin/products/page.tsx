import type { Metadata } from "next";
import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/security/session";

export const metadata: Metadata = {
  title: "Products | Admin",
  robots: { index: false, follow: false },
};

export default async function ProductsPage() {
  await requireAdmin();

  const products = await db.product.findMany({
    include: { category: true, inventory: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <main className="mx-auto max-w-5xl p-6">
      <AdminNav />
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-gold">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-gold px-6 py-2.5 font-bold text-background hover:bg-gold-light"
        >
          Add product
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-10 text-center text-muted">
          No products yet. Add your first product.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price (ETB)</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="p-3">
                    <Link href={`/admin/products/${p.id}`} className="font-semibold text-gold-light hover:underline">
                      {p.name}
                    </Link>
                    <div className="text-xs text-muted">{p.sku}</div>
                  </td>
                  <td className="p-3">{p.category.name}</td>
                  <td className="p-3">{p.price.toString()}</td>
                  <td className="p-3">
                    {p.inventory?.quantityOnHand.toString() ?? "0"} {p.unitCode}
                  </td>
                  <td className="p-3">
                    {p.publicationStatus}
                    {!p.isAvailableForSale && <span className="ml-2 text-xs text-muted">(not for sale)</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
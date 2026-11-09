import type { Metadata } from "next";
import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/security/session";

export const metadata: Metadata = {
  title: "Inventory | Admin",
  robots: { index: false, follow: false },
};

export default async function InventoryPage() {
  await requireAdmin();

  const products = await db.product.findMany({
    include: { inventory: true },
    orderBy: { name: "asc" },
    take: 300,
  });

  return (
    <main className="mx-auto max-w-4xl p-6">
      <AdminNav />
      <h1 className="mb-6 font-display text-3xl font-bold text-gold">Inventory</h1>

      {products.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-10 text-center text-muted">
          No products yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">In stock</th>
                <th className="p-3">Status</th>
                <th className="p-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="p-3">
                    <span className="font-semibold">{p.name}</span>
                    <div className="text-xs text-muted">{p.sku}</div>
                  </td>
                  <td className="p-3">
                    {p.inventory?.quantityOnHand.toString() ?? "0"} {p.unitCode}
                  </td>
                  <td className="p-3">{p.publicationStatus}</td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/admin/inventory/${p.id}`}
                      className="rounded-full border border-gold px-4 py-1.5 font-semibold text-gold hover:bg-gold hover:text-background"
                    >
                      Adjust
                    </Link>
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
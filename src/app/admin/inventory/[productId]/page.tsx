import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import AdminNav from "@/components/admin/AdminNav";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/security/session";
import StockForm from "../StockForm";

export const metadata: Metadata = {
  title: "Adjust stock | Admin",
  robots: { index: false, follow: false },
};

const when = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Addis_Ababa",
});

export default async function AdjustStockPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  await requireAdmin();

  const { productId } = await params;
  if (!z.string().uuid().safeParse(productId).success) notFound();

  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      inventory: true,
      movements: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { adminUser: { select: { username: true } } },
      },
    },
  });
  if (!product) notFound();

  return (
    <main className="mx-auto max-w-4xl p-6">
      <AdminNav />
      <Link href="/admin/inventory" className="text-sm text-muted hover:text-gold-light">
        ← All inventory
      </Link>
      <h1 className="mt-2 font-display text-3xl font-bold text-gold">{product.name}</h1>
      <p className="mb-6 mt-1 text-muted">
        In stock now:{" "}
        <strong className="text-foreground">
          {product.inventory?.quantityOnHand.toString() ?? "0"} {product.unitCode}
        </strong>
      </p>

      <section className="mb-10 rounded-2xl border border-line bg-surface p-6">
        <h2 className="mb-4 text-lg font-bold">Record a stock change</h2>
        <StockForm
          productId={product.id}
          unitCode={product.unitCode}
          requestId={randomUUID()}
        />
      </section>

      <h2 className="mb-3 text-lg font-bold">History (latest 50)</h2>
      {product.movements.length === 0 ? (
        <p className="text-muted">No stock changes recorded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="p-3">When</th>
                <th className="p-3">Type</th>
                <th className="p-3">Change</th>
                <th className="p-3">Stock after</th>
                <th className="p-3">Reason</th>
                <th className="p-3">By</th>
              </tr>
            </thead>
            <tbody>
              {product.movements.map((m) => {
                const change = m.quantityChange.toString();
                return (
                  <tr key={m.id} className="border-t border-line">
                    <td className="p-3">{when.format(m.createdAt)}</td>
                    <td className="p-3">{m.movementType}</td>
                    <td className="p-3 font-semibold">
                      {change.startsWith("-") ? change : `+${change}`}
                    </td>
                    <td className="p-3">{m.quantityAfter.toString()}</td>
                    <td className="p-3">{m.reason ?? ""}</td>
                    <td className="p-3">{m.adminUser?.username ?? "system"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
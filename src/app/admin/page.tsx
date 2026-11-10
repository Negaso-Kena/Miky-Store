import type { Metadata } from "next";
import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/security/session";

export const metadata: Metadata = {
  title: "Admin dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminHome() {
  const { admin } = await requireAdmin();
  const pending = await db.order.count({ where: { status: "PENDING" } });

  const tile =
    "rounded-2xl border border-line bg-surface px-6 py-4 font-semibold hover:border-gold";

  return (
    <main className="mx-auto max-w-4xl p-6">
      <AdminNav />
      <h1 className="font-display text-3xl font-bold text-gold">Welcome, {admin.fullName}</h1>
      <p className="mt-2 text-muted">Signed in as {admin.username}.</p>

      <div className="mt-6 flex flex-wrap gap-4">
        <Link href="/admin/orders?status=PENDING" className={tile}>
          Pending orders
          <span className="ml-3 rounded-full bg-gold px-3 py-0.5 text-sm font-bold text-background">
            {pending}
          </span>
        </Link>
        <Link href="/admin/products" className={tile}>Products</Link>
        <Link href="/admin/inventory" className={tile}>Inventory</Link>
        <Link href="/admin/categories" className={tile}>Categories</Link>
        <Link href="/admin/settings" className={tile}>Settings</Link>
      </div>
    </main>
  );
}
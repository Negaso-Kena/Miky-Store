import type { Metadata } from "next";
import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/security/session";

export const metadata: Metadata = {
  title: "Admin dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminHome() {
  const { admin } = await requireAdmin();

  return (
    <main className="mx-auto max-w-4xl p-6">
      <AdminNav />
      <h1 className="font-display text-3xl font-bold text-gold">
        Welcome, {admin.fullName}
      </h1>
      <p className="mt-2 text-muted">Signed in as {admin.username}.</p>
      <Link
        href="/admin/categories"
        className="mt-6 inline-block rounded-2xl border border-line bg-surface px-6 py-4 font-semibold hover:border-gold"
      >
        Manage categories
      </Link>
    </main>
  );
}
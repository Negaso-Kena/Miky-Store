import type { Metadata } from "next";
import AdminNav from "@/components/admin/AdminNav";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/security/session";
import SettingsForm from "./SettingsForm";

export const metadata: Metadata = {
  title: "Settings | Admin",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  await requireAdmin();
  const s = await db.storeSettings.findUnique({ where: { id: "default" } });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <AdminNav />
      <h1 className="mb-2 font-display text-3xl font-bold text-gold">Settings</h1>
      <p className="mb-6 text-muted">
        These details appear on the order confirmation page. Customers use them to
        contact the shop.
      </p>
      <div className="rounded-2xl border border-line bg-surface p-6">
        <SettingsForm
          values={{
            storeName: s?.storeName ?? "Miky Sound Systems & Electronics",
            phone: s?.phone ?? "",
            whatsapp: s?.whatsapp ?? "",
            telegram: s?.telegram ?? "",
            shopAddress: s?.shopAddress ?? "",
            deliveryCoverage: s?.deliveryCoverage ?? "",
          }}
        />
      </div>
    </main>
  );
}
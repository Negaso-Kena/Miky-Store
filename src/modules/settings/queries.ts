import { db } from "@/lib/db/client";

export async function getPublicSettings() {
  const s = await db.storeSettings.findUnique({ where: { id: "default" } });
  return {
    storeName: s?.storeName ?? "Miky Sound Systems & Electronics",
    phone: s?.phone ?? null,
    whatsapp: s?.whatsapp ?? null,
    telegram: s?.telegram ?? null,
    shopAddress: s?.shopAddress ?? null,
    deliveryCoverage: s?.deliveryCoverage ?? null,
  };
}
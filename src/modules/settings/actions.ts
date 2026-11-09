"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { normalizePhone } from "@/lib/phone";
import { requireAdmin } from "@/lib/security/session";
import type { FormState } from "@/modules/categories/types";

const schema = z.object({
  storeName: z.string().trim().min(2, "Store name is required.").max(150),
  phone: z.string().trim().max(30),
  whatsapp: z.string().trim().max(30),
  telegram: z.string().trim().max(40),
  shopAddress: z.string().trim().max(500),
  deliveryCoverage: z.string().trim().max(1000),
});

export async function updateSettingsAction(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const { admin } = await requireAdmin();
  const s = (k: string) => String(fd.get(k) ?? "");

  const parsed = schema.safeParse({
    storeName: s("storeName"),
    phone: s("phone"),
    whatsapp: s("whatsapp"),
    telegram: s("telegram"),
    shopAddress: s("shopAddress"),
    deliveryCoverage: s("deliveryCoverage"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const d = parsed.data;

  const phone = d.phone ? normalizePhone(d.phone) : "";
  if (phone === null) return { error: "Telephone: use digits only, like +251911223344." };

  const whatsapp = d.whatsapp ? normalizePhone(d.whatsapp) : "";
  if (whatsapp === null || (whatsapp && !whatsapp.startsWith("+"))) {
    return { error: "WhatsApp number must be international, like +251911223344." };
  }

  const telegram = d.telegram.replace(/^@/, "");
  if (telegram && !/^[A-Za-z0-9_]{4,32}$/.test(telegram)) {
    return { error: "Telegram username: 4 to 32 letters, numbers or underscores." };
  }

  const data = {
    storeName: d.storeName,
    phone: phone || null,
    whatsapp: whatsapp || null,
    telegram: telegram || null,
    shopAddress: d.shopAddress || null,
    deliveryCoverage: d.deliveryCoverage || null,
  };

  await db.storeSettings.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });
  await db.auditLog.create({
    data: {
      adminUserId: admin.id,
      action: "SETTINGS_UPDATED",
      entityType: "StoreSettings",
      entityId: "default",
    },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/checkout");
  revalidatePath("/checkout/done");
  return { success: "Settings saved." };
}
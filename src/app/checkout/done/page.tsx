import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ClearCartOnMount from "@/components/store/ClearCartOnMount";
import SiteFooter from "@/components/store/SiteFooter";
import SiteHeader from "@/components/store/SiteHeader";
import { db } from "@/lib/db/client";
import { getPublicSettings } from "@/modules/settings/queries";

export const metadata: Metadata = {
  title: "Order received | Miky Sound Systems & Electronics",
  robots: { index: false, follow: false },
};

const REF_RE = /^MK-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const btn =
  "rounded-full border border-gold px-6 py-3 font-semibold text-gold hover:bg-gold hover:text-background";

export default async function DonePage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string | string[] }>;
}) {
  const sp = await searchParams;
  const ref = Array.isArray(sp.ref) ? sp.ref[0] : sp.ref;
  if (!ref || !REF_RE.test(ref)) notFound();

  const order = await db.order.findUnique({
    where: { orderNumber: ref },
    select: { fulfillmentMethod: true },
  });
  if (!order) notFound();

  const s = await getPublicSettings();
  const wa = s.whatsapp ? s.whatsapp.replace(/\D/g, "") : null;
  const message = encodeURIComponent(`Hello, I placed order ${ref}.`);
  const hasContact = Boolean(s.phone || wa || s.telegram);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <ClearCartOnMount />
      <main className="mx-auto max-w-2xl px-5 py-10">
        <h1 className="font-display text-4xl font-bold">Order received</h1>
        <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
          <p className="text-sm text-muted">Your order reference</p>
          <p className="mt-1 font-display text-4xl font-bold tracking-wider text-gold">{ref}</p>
          <p className="mt-4 text-[#d9d3c7]">
            Save this reference and the telephone number you used. The shop will
            contact you to confirm availability
            {order.fulfillmentMethod === "DELIVERY"
              ? " and your delivery fee"
              : " and pickup time"}
            . Your order is not final until the shop confirms it.
          </p>

          {order.fulfillmentMethod === "PICKUP" && (
            <p className="mt-4 text-sm text-muted">
              {s.shopAddress ?? "The shop will tell you where to collect your order."}
            </p>
          )}

          <h2 className="mt-6 font-bold">Contact the shop</h2>
          {hasContact ? (
            <div className="mt-3 flex flex-wrap gap-3">
              {wa && (
                <a className={btn} target="_blank" rel="noopener noreferrer" href={`https://wa.me/${wa}?text=${message}`}>
                  WhatsApp
                </a>
              )}
              {s.phone && (
                <a className={btn} href={`tel:${s.phone}`}>Call</a>
              )}
              {s.telegram && (
                <a className={btn} target="_blank" rel="noopener noreferrer" href={`https://t.me/${s.telegram}`}>
                  Telegram
                </a>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">
              The shop will contact you by telephone using the number you gave.
            </p>
          )}
        </div>

        <Link href="/shop" className="mt-6 inline-block text-sm text-muted underline hover:text-gold-light">
          Continue shopping
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
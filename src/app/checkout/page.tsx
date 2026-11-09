import type { Metadata } from "next";
import CheckoutForm from "@/components/store/CheckoutForm";
import SiteFooter from "@/components/store/SiteFooter";
import SiteHeader from "@/components/store/SiteHeader";
import { getPublicSettings } from "@/modules/settings/queries";

export const metadata: Metadata = {
  title: "Checkout | Miky Sound Systems & Electronics",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const settings = await getPublicSettings();
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-8">
        <h1 className="mb-6 font-display text-4xl font-bold">Checkout</h1>
        <CheckoutForm
          shopAddress={settings.shopAddress}
          deliveryCoverage={settings.deliveryCoverage}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
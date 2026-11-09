import type { Metadata } from "next";
import CartView from "@/components/store/CartView";
import SiteFooter from "@/components/store/SiteFooter";
import SiteHeader from "@/components/store/SiteHeader";

export const metadata: Metadata = {
  title: "Your cart | Miky Sound Systems & Electronics",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 py-8">
        <h1 className="mb-6 font-display text-4xl font-bold">Your cart</h1>
        <CartView />
      </main>
      <SiteFooter />
    </div>
  );
}
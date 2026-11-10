import type { Metadata } from "next";
import SiteFooter from "@/components/store/SiteFooter";
import SiteHeader from "@/components/store/SiteHeader";
import TrackForm from "./TrackForm";

// Tracking pages are private, so search engines must not index them.
export const metadata: Metadata = {
  title: "Track your order | Miky Sound Systems & Electronics",
  robots: { index: false, follow: false },
};

const REF_RE = /^MK-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string | string[] }>;
}) {
  // Optional: /track?ref=MK-XXXX-XXXX pre-fills the reference box.
  // Only a correctly formatted reference is accepted.
  const sp = await searchParams;
  const raw = Array.isArray(sp.ref) ? sp.ref[0] : sp.ref;
  const defaultRef = raw && REF_RE.test(raw.toUpperCase()) ? raw.toUpperCase() : "";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-8">
        <h1 className="mb-6 font-display text-4xl font-bold">Track your order</h1>
        <TrackForm defaultRef={defaultRef} />
      </main>
      <SiteFooter />
    </div>
  );
}
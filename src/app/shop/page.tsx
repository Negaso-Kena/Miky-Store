import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/store/ProductCard";
import SiteFooter from "@/components/store/SiteFooter";
import SiteHeader from "@/components/store/SiteHeader";
import {
  getActiveCategories,
  listProducts,
  PAGE_SIZE,
} from "@/modules/catalog/queries";
import ShopFilters from "./ShopFilters";

export const metadata: Metadata = {
  title: "Shop | Miky Sound Systems & Electronics",
  description:
    "Browse speakers, amplifiers, batteries, voltage regulators and audio accessories.",
  alternates: { canonical: "/shop" },
};

// The address can contain a value once or several times; use the first.
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  // Read the search text, category and page from the address, with limits
  // so nobody can send oversized or nonsense values.
  const q = first(sp.q)?.trim().slice(0, 80) || undefined;
  const category = first(sp.category)?.slice(0, 120) || undefined;
  const pageNum = Number.parseInt(first(sp.page) ?? "1", 10);
  const page = Number.isFinite(pageNum) && pageNum > 0 ? Math.min(pageNum, 1000) : 1;

  // Load the category buttons and the products at the same time.
  // Only published products in active categories are ever returned.
  const [categories, { products, total }] = await Promise.all([
    getActiveCategories(),
    listProducts({ q, category, sort: "newest", inStock: false, page }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Builds the Previous / Next links while keeping the current search and category.
  function pageHref(n: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (n > 1) params.set("page", String(n));
    const qs = params.toString();
    return qs ? `/shop?${qs}` : "/shop";
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="mb-6 font-display text-4xl font-bold">Shop</h1>

        {/* Live search box and category row */}
        <ShopFilters
          categories={categories}
          initialQuery={q ?? ""}
          activeCategory={category ?? ""}
        />

        {/* Announced to screen readers whenever the result count changes */}
        <p className="mb-4 text-sm text-muted" role="status">
          {total} {total === 1 ? "product" : "products"}
        </p>

        {products.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-line p-10 text-center text-muted">
            <p className="text-lg font-semibold text-foreground">No products found</p>
            <p>Try a different search or choose another category.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {/* Page buttons appear only when there are more than 12 products */}
        {pages > 1 && (
          <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-4 text-sm font-semibold">
            {page > 1 && (
              <Link href={pageHref(page - 1)} className="rounded-full border border-line px-5 py-2 hover:border-gold">
                Previous
              </Link>
            )}
            <span className="text-muted">Page {page} of {pages}</span>
            {page < pages && (
              <Link href={pageHref(page + 1)} className="rounded-full border border-line px-5 py-2 hover:border-gold">
                Next
              </Link>
            )}
          </nav>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
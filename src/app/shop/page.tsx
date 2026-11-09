import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/store/ProductCard";
import SiteFooter from "@/components/store/SiteFooter";
import SiteHeader from "@/components/store/SiteHeader";
import {
  getActiveCategories,
  listProducts,
  PAGE_SIZE,
  type SortKey,
} from "@/modules/catalog/queries";

export const metadata: Metadata = {
  title: "Shop | Miky Sound Systems & Electronics",
  description:
    "Browse speakers, amplifiers, batteries, voltage regulators and audio accessories.",
  alternates: { canonical: "/shop" },
};

const SORTS: Record<SortKey, string> = {
  newest: "Newest first",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  name: "Name A to Z",
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const field = "w-full rounded-xl border border-line bg-background px-3 py-2.5";
const lbl = "mb-1 block text-sm font-semibold";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const q = first(sp.q)?.trim().slice(0, 80) || undefined;
  const category = first(sp.category)?.slice(0, 120) || undefined;
  const sortRaw = first(sp.sort) ?? "newest";
  const sort = (sortRaw in SORTS ? sortRaw : "newest") as SortKey;
  const inStock = first(sp.inStock) === "1";
  const minPrice = first(sp.minPrice)?.trim() || undefined;
  const maxPrice = first(sp.maxPrice)?.trim() || undefined;
  const pageNum = Number.parseInt(first(sp.page) ?? "1", 10);
  const page = Number.isFinite(pageNum) && pageNum > 0 ? Math.min(pageNum, 1000) : 1;

  const [categories, { products, total }] = await Promise.all([
    getActiveCategories(),
    listProducts({ q, category, sort, inStock, minPrice, maxPrice, page }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(n: number) {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (category) u.set("category", category);
    if (sort !== "newest") u.set("sort", sort);
    if (inStock) u.set("inStock", "1");
    if (minPrice) u.set("minPrice", minPrice);
    if (maxPrice) u.set("maxPrice", maxPrice);
    if (n > 1) u.set("page", String(n));
    const s = u.toString();
    return s ? `/shop?${s}` : "/shop";
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="mb-6 font-display text-4xl font-bold">Shop</h1>

        <form method="get" action="/shop" className="mb-8 grid gap-4 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label htmlFor="q" className={lbl}>Search</label>
            <input id="q" name="q" type="search" defaultValue={q} placeholder="Name, brand, code or specification" className={field} />
          </div>
          <div>
            <label htmlFor="category" className={lbl}>Category</label>
            <select id="category" name="category" defaultValue={category ?? ""} className={field}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sort" className={lbl}>Sort by</label>
            <select id="sort" name="sort" defaultValue={sort} className={field}>
              {Object.entries(SORTS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="minPrice" className={lbl}>Min price (ETB)</label>
            <input id="minPrice" name="minPrice" inputMode="decimal" defaultValue={minPrice} className={field} />
          </div>
          <div>
            <label htmlFor="maxPrice" className={lbl}>Max price (ETB)</label>
            <input id="maxPrice" name="maxPrice" inputMode="decimal" defaultValue={maxPrice} className={field} />
          </div>
          <label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold">
            <input type="checkbox" name="inStock" value="1" defaultChecked={inStock} className="h-4 w-4" />
            In stock only
          </label>
          <div className="flex items-end gap-3">
            <button className="rounded-full bg-gold px-6 py-2.5 font-bold text-background hover:bg-gold-light">
              Apply
            </button>
            <Link href="/shop" className="py-2.5 text-sm text-muted hover:text-gold-light">
              Reset
            </Link>
          </div>
        </form>

        <p className="mb-4 text-sm text-muted" role="status">
          {total} {total === 1 ? "product" : "products"}
        </p>

        {products.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-line p-10 text-center text-muted">
            <p className="text-lg font-semibold text-foreground">No products found</p>
            <p>Try a different search or clear the filters.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

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
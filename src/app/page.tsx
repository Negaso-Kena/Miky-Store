import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/store/ProductCard";
import SiteFooter from "@/components/store/SiteFooter";
import SiteHeader from "@/components/store/SiteHeader";
import { getActiveCategories, getFeaturedProducts } from "@/modules/catalog/queries";

export default async function Home() {
  const [categories, featured] = await Promise.all([
    getActiveCategories(),
    getFeaturedProducts(4),
  ]);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-5">
        <section className="relative my-6 min-h-[420px] overflow-hidden rounded-3xl border border-line md:min-h-[520px]">
          <Image
            src="/shop.jpg"
            alt="Miky Sound Systems & Electronics shop"
            fill
            priority
            sizes="(min-width: 1152px) 1152px, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
          <div className="relative flex h-full min-h-[420px] max-w-xl flex-col justify-center p-8 md:min-h-[520px] md:p-14">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold">
              Sound · Power · Electronics
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">
              Premium sound, reliable power
            </h1>
            <p className="mt-4 text-lg text-[#d9d3c7]">
              Speakers, amplifiers, batteries and voltage regulators, available
              to collect from our shop or delivered to you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="rounded-full bg-gold px-8 py-3 font-bold text-background hover:bg-gold-light">
                Shop now
              </Link>
              <Link href="/track" className="rounded-full border border-white/40 px-8 py-3 font-semibold hover:border-gold hover:text-gold-light">
                Track an order
              </Link>
            </div>
          </div>
        </section>

        {categories.length > 0 && (
          <>
            <h2 className="mt-12 mb-4 font-display text-3xl font-bold">Shop by category</h2>
            <ul className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/shop?category=${c.slug}`}
                    className="inline-block rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold hover:border-gold hover:text-gold-light"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <h2 className="mt-12 mb-4 font-display text-3xl font-bold">Featured products</h2>
        {featured.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-line p-10 text-center text-muted">
            <p className="text-lg font-semibold text-foreground">Products are on the way</p>
            <p>The catalog is being set up. Check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
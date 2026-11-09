import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { availabilityLabel } from "@/components/store/ProductCard";
import SiteFooter from "@/components/store/SiteFooter";
import SiteHeader from "@/components/store/SiteHeader";
import { formatEtb } from "@/lib/format";
import { getProductBySlug } from "@/modules/catalog/queries";
import AddToCart from "@/components/store/AddToCart";

type Props = { params: Promise<{ slug: string }> };

const clean = (s: string | null, max: number) =>
  (s ?? "").replace(/\s+/g, " ").trim().slice(0, max);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product not found", robots: { index: false } };

  const description =
    clean(p.description, 155) ||
    `${p.name} from Miky Sound Systems & Electronics. ${formatEtb(p.price)}.`;
  const title = `${p.name} | Miky Sound Systems & Electronics`;

  return {
    title,
    description,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: {
      title,
      description,
      url: `/products/${p.slug}`,
      type: "website",
      siteName: "Miky Sound Systems & Electronics",
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();

  const a = availabilityLabel[p.availability];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.sku,
    description: clean(p.description, 500) || undefined,
    category: p.category.name,
    offers: {
      "@type": "Offer",
      priceCurrency: "ETB",
      price: p.price,
      availability:
        p.availability === "in-stock"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
          <Link href="/shop" className="hover:text-gold-light">Shop</Link>
          {" / "}
          <Link href={`/shop?category=${p.category.slug}`} className="hover:text-gold-light">
            {p.category.name}
          </Link>
        </nav>

        <div className="grid gap-8 md:grid-cols-2">
          <div
            aria-hidden="true"
            className="grid aspect-square place-items-center rounded-3xl border border-line bg-surface font-display text-9xl text-gold/50"
          >
            {p.name.charAt(0).toUpperCase()}
          </div>

          <div>
            <h1 className="font-display text-4xl font-bold leading-tight">{p.name}</h1>
            <p className="mt-1 text-sm text-muted">Code: {p.sku}</p>

            <p className="mt-5 text-3xl font-bold text-gold-light">
              {formatEtb(p.price)}
              {p.unitCode !== "piece" && (
                <span className="ml-2 text-base font-normal text-muted">per {p.unitCode}</span>
              )}
            </p>
            <p className={`mt-2 font-semibold ${a.cls}`}>{a.text}</p>

            <AddToCart
              productId={p.id}
              unitCode={p.unitCode}
              canOrder={p.availability === "in-stock"}
            />
            <p className="mt-4 text-sm text-muted">
              Prices are in ETB. An order request is confirmed by the shop before it
              becomes a sale.
            </p>
          </div>
        </div>

        {p.description && (
          <section className="mt-10">
            <h2 className="mb-3 font-display text-2xl font-bold">Description</h2>
            <p className="max-w-3xl whitespace-pre-line text-[#d9d3c7]">{p.description}</p>
          </section>
        )}

        {p.specifications.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 font-display text-2xl font-bold">Specifications</h2>
            <dl className="max-w-3xl divide-y divide-line rounded-2xl border border-line">
              {p.specifications.map((s, i) => (
                <div key={i} className="grid grid-cols-3 gap-4 p-3 text-sm">
                  <dt className="font-semibold text-muted">{s.name}</dt>
                  <dd className="col-span-2">{s.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </main>
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </div>
  );
}
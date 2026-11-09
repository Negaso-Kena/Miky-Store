import Link from "next/link";
import { formatEtb } from "@/lib/format";
import type { CardProduct } from "@/modules/catalog/queries";

export const availabilityLabel = {
  "in-stock": { text: "In stock", cls: "text-gold-light" },
  "out-of-stock": { text: "Out of stock", cls: "text-danger" },
  unavailable: { text: "Currently unavailable", cls: "text-muted" },
} as const;

export default function ProductCard({ product }: { product: CardProduct }) {
  const a = availabilityLabel[product.availability];
  return (
    <article className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-gold">
      <Link href={`/products/${product.slug}`} className="flex flex-col gap-2">
        <div
          aria-hidden="true"
          className="grid aspect-square place-items-center rounded-xl bg-surface-2 font-display text-5xl text-gold/60"
        >
          {product.name.charAt(0).toUpperCase()}
        </div>
        <span className="text-xs text-muted">{product.categoryName}</span>
        <h3 className="font-semibold leading-snug">{product.name}</h3>
      </Link>
      <p className="text-lg font-bold">
        {formatEtb(product.price)}
        {product.unitCode !== "piece" && (
          <span className="ml-1 text-xs font-normal text-muted">per {product.unitCode}</span>
        )}
      </p>
      <p className={`text-sm font-semibold ${a.cls}`}>{a.text}</p>
    </article>
  );
}
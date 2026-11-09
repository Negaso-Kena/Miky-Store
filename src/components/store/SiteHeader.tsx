import Image from "next/image";
import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/miky-mark.png" alt="" width={44} height={44} priority className="h-11 w-11" />
          <span className="leading-tight">
            <span className="block font-display text-xl font-bold tracking-[0.18em] text-gold">
              MIKY
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.2em] text-muted sm:block">
              Sound Systems &amp; Electronics
            </span>
          </span>
        </Link>

        <nav aria-label="Main" className="ml-auto flex items-center gap-6 text-sm font-medium text-muted">
          <Link href="/shop" className="hover:text-gold-light">Shop</Link>
          <Link href="/track" className="hover:text-gold-light">Track order</Link>
          <Link
            href="/cart"
            className="rounded-full border border-gold px-4 py-2 font-semibold text-gold hover:bg-gold hover:text-background"
          >
            Cart
          </Link>
        </nav>
      </div>
    </header>
  );
}
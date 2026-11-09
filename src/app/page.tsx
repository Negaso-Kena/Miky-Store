import Image from "next/image";
import Link from "next/link";

const categories = [
  "Sound Systems and Speakers",
  "Amplifiers and Mixers",
  "Batteries and Power Equipment",
  "Voltage Regulators",
  "Cables and Audio Accessories",
  "Other Electronics",
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/miky-mark.png"
              alt=""
              width={44}
              height={44}
              priority
              className="h-11 w-11"
            />
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
              <Link
                href="/shop"
                className="rounded-full bg-gold px-8 py-3 font-bold text-background hover:bg-gold-light"
              >
                Shop now
              </Link>
              <Link
                href="/track"
                className="rounded-full border border-white/40 px-8 py-3 font-semibold hover:border-gold hover:text-gold-light"
              >
                Track an order
              </Link>
            </div>
          </div>
        </section>

        <h2 className="mt-12 mb-4 font-display text-3xl font-bold">Shop by category</h2>
        <ul className="flex flex-wrap gap-2">
          {categories.map((name) => (
            <li key={name}>
              <Link
                href="/shop"
                className="inline-block rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold hover:border-gold hover:text-gold-light"
              >
                {name}
              </Link>
            </li>
          ))}
        </ul>

        <h2 className="mt-12 mb-4 font-display text-3xl font-bold">Featured products</h2>
        <div className="rounded-2xl border-2 border-dashed border-line p-10 text-center text-muted">
          <p className="text-lg font-semibold text-foreground">Products are on the way</p>
          <p>The catalog is being set up. Check back soon.</p>
        </div>
      </main>

      <footer className="mt-16 border-t border-line py-8 text-center text-sm text-muted">
        Miky Sound Systems &amp; Electronics
      </footer>
    </div>
  );
}
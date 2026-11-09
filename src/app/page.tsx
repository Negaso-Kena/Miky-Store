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
    <div className="min-h-screen bg-[#0b0a14] text-[#f4f2fb]">
      <header className="border-b border-[#2e2a54]">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-5 py-4">
          <Link href="/" className="text-lg font-extrabold tracking-wide">
            MIKY
          </Link>
          <nav aria-label="Main" className="ml-auto flex gap-5 text-sm font-semibold text-[#a9a4c9]">
            <Link href="/shop" className="hover:text-white">Shop</Link>
            <Link href="/track" className="hover:text-white">Track order</Link>
            <Link href="/cart" className="hover:text-white">Cart</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5">
        <section className="my-6 grid items-center gap-8 overflow-hidden rounded-3xl border border-[#2e2a54] bg-[radial-gradient(60%_90%_at_85%_40%,rgba(194,75,240,.35),transparent_70%),#15132a] p-8 md:grid-cols-2 md:p-12">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
              Premium sound, reliable power
            </h1>
            <p className="mt-4 max-w-md text-lg text-[#a9a4c9]">
              Speakers, amplifiers, batteries and voltage regulators from Miky.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-block rounded-full bg-gradient-to-r from-[#6a3df0] to-[#c24bf0] px-7 py-3 font-bold"
            >
              Shop now
            </Link>
          </div>
          <Image
            src="/miky-logo.png"
            alt="Miky Sound Systems & Electronics"
            width={1280}
            height={697}
            priority
            className="h-auto w-full rounded-2xl"
          />
        </section>

        <h2 className="mt-10 mb-4 text-2xl font-bold">Shop by category</h2>
        <ul className="flex flex-wrap gap-2">
          {categories.map((name) => (
            <li key={name}>
              <Link
                href="/shop"
                className="inline-block rounded-full border border-[#2e2a54] bg-[#15132a] px-4 py-2 text-sm font-semibold"
              >
                {name}
              </Link>
            </li>
          ))}
        </ul>

        <h2 className="mt-10 mb-4 text-2xl font-bold">Featured products</h2>
        <div className="rounded-2xl border-2 border-dashed border-[#2e2a54] p-10 text-center text-[#a9a4c9]">
          <p className="text-lg font-semibold text-white">Products are on the way</p>
          <p>The catalog is being set up. Check back soon.</p>
        </div>
      </main>

      <footer className="mt-16 border-t border-[#2e2a54] py-8 text-center text-sm text-[#a9a4c9]">
        Miky Sound Systems &amp; Electronics · Prices in ETB
      </footer>
    </div>
  );
}
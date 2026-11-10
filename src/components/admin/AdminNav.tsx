import Link from "next/link";
import { logoutAction } from "@/modules/auth/actions";

export default function AdminNav() {
  return (
    <nav
      aria-label="Admin"
      className="mb-8 flex flex-wrap items-center gap-5 border-b border-line pb-4 text-sm font-semibold"
    >
      <Link href="/admin" className="text-gold">
      Dashboard
      </Link>
      <Link href="/admin/orders" className="text-muted hover:text-gold-light">
        Orders
      </Link>
      <Link href="/admin/categories" className="text-muted hover:text-gold-light">
        Categories
      </Link>
      <Link href="/admin/products" className="text-muted hover:text-gold-light">
        Products
      </Link>
      <Link href="/admin/inventory" className="text-muted hover:text-gold-light">
        Inventory
      </Link>
      <form action={logoutAction} className="ml-auto">
        <button className="rounded-full border border-gold px-4 py-1.5 text-gold hover:bg-gold hover:text-background">
          Sign out
        </button>
        <Link href="/admin/settings" className="text-muted hover:text-gold-light">
        Settings
      </Link>
      </form>
    </nav>
  );
}
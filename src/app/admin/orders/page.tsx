import type { Metadata } from "next";
import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db/client";
import { formatEtb } from "@/lib/format";
import { requireAdmin } from "@/lib/security/session";
import {
  ORDER_STATUSES,
  STATUS_LABEL,
  type OrderStatusValue,
} from "@/modules/orders/transitions";

export const metadata: Metadata = {
  title: "Orders | Admin",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 20;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const when = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Addis_Ababa",
});

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  const statusRaw = first(sp.status);
  const status = ORDER_STATUSES.find((s) => s === statusRaw) as OrderStatusValue | undefined;
  const q = first(sp.q)?.trim().slice(0, 60) || undefined;
  const pageNum = Number.parseInt(first(sp.page) ?? "1", 10);
  const page = Number.isFinite(pageNum) && pageNum > 0 ? Math.min(pageNum, 1000) : 1;

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q.toUpperCase() } },
            { customerPhone: { contains: q.replace(/\s/g, "") } },
            { customerName: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, orders, counts] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countOf = (s: string) => counts.find((c) => c.status === s)?._count._all ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function href(p: { status?: string; page?: number }) {
    const u = new URLSearchParams();
    if (p.status) u.set("status", p.status);
    if (q) u.set("q", q);
    if (p.page && p.page > 1) u.set("page", String(p.page));
    const s = u.toString();
    return s ? `/admin/orders?${s}` : "/admin/orders";
  }

  const chip = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm font-semibold ${
      active ? "border-gold bg-gold text-background" : "border-line bg-surface hover:border-gold"
    }`;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <AdminNav />
      <h1 className="mb-6 font-display text-3xl font-bold text-gold">Orders</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href={href({})} className={chip(!status)}>All</Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} href={href({ status: s })} className={chip(status === s)}>
            {STATUS_LABEL[s]} ({countOf(s)})
          </Link>
        ))}
      </div>

      <form method="get" action="/admin/orders" className="mb-6 flex flex-wrap gap-3">
        {status && <input type="hidden" name="status" value={status} />}
        <label htmlFor="q" className="sr-only">Search orders</label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Reference, phone or name"
          className="w-72 rounded-xl border border-line bg-background px-3 py-2.5"
        />
        <button className="rounded-full bg-gold px-6 py-2.5 font-bold text-background hover:bg-gold-light">
          Search
        </button>
      </form>

      {orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-10 text-center text-muted">
          No orders found.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="p-3">Reference</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Method</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3">Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-line">
                  <td className="p-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold text-gold-light hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="p-3">
                    {o.customerName}
                    <div className="text-xs text-muted">{o.customerPhone}</div>
                  </td>
                  <td className="p-3">{o.fulfillmentMethod === "PICKUP" ? "Pickup" : "Delivery"}</td>
                  <td className="p-3">
                    {o.total ? formatEtb(o.total.toString()) : `${formatEtb(o.subtotal.toString())} + fee`}
                  </td>
                  <td className="p-3">{STATUS_LABEL[o.status as OrderStatusValue]}</td>
                  <td className="p-3">{when.format(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-4 text-sm font-semibold">
          {page > 1 && (
            <Link href={href({ status, page: page - 1 })} className="rounded-full border border-line px-5 py-2 hover:border-gold">
              Previous
            </Link>
          )}
          <span className="text-muted">Page {page} of {pages}</span>
          {page < pages && (
            <Link href={href({ status, page: page + 1 })} className="rounded-full border border-line px-5 py-2 hover:border-gold">
              Next
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
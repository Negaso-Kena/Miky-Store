import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import AdminNav from "@/components/admin/AdminNav";
import { db } from "@/lib/db/client";
import { formatEtb } from "@/lib/format";
import { requireAdmin } from "@/lib/security/session";
import {
  advanceOptions,
  CANCELLABLE,
  STATUS_LABEL,
  type MethodValue,
  type OrderStatusValue,
} from "@/modules/orders/transitions";
import { AdvanceForm, CancelForm, ConfirmForm, FeeForm } from "../OrderActions";

export const metadata: Metadata = {
  title: "Order | Admin",
  robots: { index: false, follow: false },
};

const when = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Addis_Ababa",
});

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { productName: "asc" },
        include: { product: { select: { inventory: { select: { quantityOnHand: true } } } } },
      },
      statusHistory: {
        orderBy: { createdAt: "asc" },
        include: { changedByAdmin: { select: { username: true } } },
      },
    },
  });
  if (!order) notFound();

  const status = order.status as OrderStatusValue;
  const method = order.fulfillmentMethod as MethodValue;
  const isPending = status === "PENDING";
  const feeMissing = method === "DELIVERY" && order.deliveryFee === null;
  const next = advanceOptions(status, method);
  const canCancel = CANCELLABLE.includes(status);
  const canRestock = order.inventoryDeductedAt !== null && order.inventoryRestoredAt === null;

  const card = "rounded-2xl border border-line bg-surface p-5";

  return (
    <main className="mx-auto max-w-4xl p-6">
      <AdminNav />
      <Link href="/admin/orders" className="text-sm text-muted hover:text-gold-light">← All orders</Link>

      <div className="mb-6 mt-2 flex flex-wrap items-baseline gap-4">
        <h1 className="font-display text-3xl font-bold text-gold">{order.orderNumber}</h1>
        <span className="rounded-full border border-gold px-4 py-1 text-sm font-semibold">
          {STATUS_LABEL[status]}
        </span>
        <span className="text-sm text-muted">Placed {when.format(order.createdAt)}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className={card}>
          <h2 className="mb-2 font-bold">Customer</h2>
          <p>{order.customerName}</p>
          <p>
            <a href={`tel:${order.customerPhone}`} className="text-gold-light underline">
              {order.customerPhone}
            </a>
          </p>
          {order.customerNote && (
            <p className="mt-3 text-sm text-muted">Note: {order.customerNote}</p>
          )}
        </section>

        <section className={card}>
          <h2 className="mb-2 font-bold">{method === "PICKUP" ? "Shop pickup" : "Home delivery"}</h2>
          {method === "DELIVERY" ? (
            <p className="whitespace-pre-line">{order.deliveryAddress}</p>
          ) : (
            <p className="text-muted">Customer collects from the shop. No delivery fee.</p>
          )}
        </section>
      </div>

      <section className={`${card} mt-4`}>
        <h2 className="mb-3 font-bold">Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="py-2">Product</th>
                <th className="py-2">Qty</th>
                <th className="py-2">Unit price</th>
                <th className="py-2">Total</th>
                {isPending && <th className="py-2">In stock now</th>}
              </tr>
            </thead>
            <tbody>
              {order.items.map((i) => {
                const stock = i.product?.inventory?.quantityOnHand;
                const short = stock === undefined || stock.lt(i.quantity);
                return (
                  <tr key={i.id} className="border-t border-line">
                    <td className="py-2">
                      {i.productName}
                      <div className="text-xs text-muted">{i.sku}</div>
                    </td>
                    <td className="py-2">{i.quantity.toString()} {i.unitCode}</td>
                    <td className="py-2">{formatEtb(i.unitPrice.toString())}</td>
                    <td className="py-2">{formatEtb(i.lineTotal.toString())}</td>
                    {isPending && (
                      <td className={`py-2 font-semibold ${short ? "text-danger" : "text-gold-light"}`}>
                        {stock === undefined ? "n/a" : stock.toString()}
                        {short && " (not enough)"}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <dl className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatEtb(order.subtotal.toString())}</dd></div>
          <div className="flex justify-between">
            <dt>Delivery fee</dt>
            <dd>{order.deliveryFee === null ? "To be confirmed" : formatEtb(order.deliveryFee.toString())}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 font-bold">
            <dt>Total</dt>
            <dd>{order.total === null ? "To be confirmed" : formatEtb(order.total.toString())}</dd>
          </div>
        </dl>
      </section>

      {(isPending || next.length > 0 || canCancel) && (
        <section className={`${card} mt-4 space-y-6`}>
          <h2 className="font-bold">Actions</h2>

          {isPending && method === "DELIVERY" && (
            <FeeForm orderId={order.id} current={order.deliveryFee?.toString() ?? ""} />
          )}

          {isPending && (
            <div>
              {feeMissing && (
                <p className="mb-2 text-sm text-muted">Save the delivery fee first, then confirm.</p>
              )}
              <ConfirmForm orderId={order.id} />
              <p className="mt-2 text-xs text-muted">
                Confirming deducts the stock for every item. If one item is short, nothing changes.
              </p>
            </div>
          )}

          {next.map((to) => (
            <AdvanceForm key={to} orderId={order.id} to={to} label={`Mark as ${STATUS_LABEL[to]}`} />
          ))}

          {canCancel && <CancelForm orderId={order.id} canRestock={canRestock} />}
        </section>
      )}

      <section className={`${card} mt-4`}>
        <h2 className="mb-3 font-bold">History</h2>
        <ul className="space-y-2 text-sm">
          {order.statusHistory.map((h) => (
            <li key={h.id}>
              <span className="text-muted">{when.format(h.createdAt)}</span>{" "}
              {h.previousStatus ? `${STATUS_LABEL[h.previousStatus as OrderStatusValue]} → ` : ""}
              <strong>{STATUS_LABEL[h.newStatus as OrderStatusValue]}</strong>
              {h.changedByAdmin ? ` by ${h.changedByAdmin.username}` : " (customer)"}
              {h.reason ? `. ${h.reason}` : ""}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
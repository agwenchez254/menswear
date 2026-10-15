import type { MyOrder } from "@/models";
import { formatKES } from "@/lib/format";
import { receiptModel } from "./receipt";

const when = (iso: string): string => new Date(iso).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });

/** The printable receipt. Everything outside `.print-area` is hidden when printing (see index.css). */
export function Receipt({ order }: { order: MyOrder }) {
  const m = receiptModel(order);
  return (
    <article className="print-area rounded-3xl bg-surface p-6 ring-1 ring-ink/15 md:p-8" aria-label={m.heading}>
      {m.seller && (
        <header className="border-b border-line pb-4 text-sm">
          <p className="text-base font-semibold">{m.seller.businessName}</p>
          {m.seller.address && <p className="text-muted">{m.seller.address}</p>}
          <p className="text-muted">KRA PIN: {m.seller.kraPin}</p>
        </header>
      )}
      <h2 className="display mt-4 text-3xl">{m.heading}</h2>
      {m.banner && <p className="mt-2 inline-block border border-ink px-3 py-1 text-sm font-semibold uppercase tracking-wide">{m.banner}</p>}
      <dl className="mt-4 grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Order</dt>
          <dd className="font-medium">{order.id}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Date</dt>
          <dd>{when(order.placedAt)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Customer</dt>
          <dd>{order.name}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Payment</dt>
          <dd>{order.payment}</dd>
        </div>
      </dl>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-ink text-left">
            <th className="py-2 font-semibold">Item</th>
            <th className="py-2 text-right font-semibold">Qty</th>
            <th className="py-2 text-right font-semibold">Price</th>
            <th className="py-2 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.lines.map((l) => (
            <tr key={l.key} className="border-b border-line align-top">
              <td className="py-2">
                {l.name}
                <span className="block text-muted">
                  {l.colour}, size {l.size}
                </span>
              </td>
              <td className="py-2 text-right tabular-nums">{l.qty}</td>
              <td className="py-2 text-right tabular-nums">{l.unitPrice !== undefined ? formatKES(l.unitPrice) : ""}</td>
              <td className="py-2 text-right tabular-nums">{formatKES(l.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="ml-auto mt-4 max-w-xs space-y-1 text-sm tabular-nums">
        <div className="flex justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd>{formatKES(order.subtotal)}</dd>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted">Discount</dt>
            <dd>-{formatKES(order.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted">Delivery</dt>
          <dd>{order.delivery === 0 ? "Free" : formatKES(order.delivery)}</dd>
        </div>
        <div className="flex justify-between border-t border-ink pt-2 text-base font-semibold">
          <dt>Total</dt>
          <dd>{formatKES(order.total)}</dd>
        </div>
        {m.vat && (
          <>
            <div className="flex justify-between text-muted">
              <dt>Total without VAT</dt>
              <dd>{formatKES(m.vat.net)}</dd>
            </div>
            <div className="flex justify-between text-muted">
              <dt>{m.vat.label}</dt>
              <dd>{formatKES(m.vat.amount)}</dd>
            </div>
          </>
        )}
      </dl>
      <p className="mt-6 border-t border-line pt-3 text-xs text-muted">{m.notice}</p>
    </article>
  );
}

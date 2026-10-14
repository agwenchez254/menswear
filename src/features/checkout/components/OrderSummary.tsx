import type { OrderSummaryProps } from "@/features/checkout/models";
import { PROMO } from "@/config/commerce";
import { formatKES } from "@/lib/format";
import { lineTotal } from "@/services/pricing";
import { Photo } from "@/components/ui/Photo";

export function OrderSummary({ lines, subtotal, discount, delivery, total, method, hasZone, promoInput, promoError, promoApplied, onPromoInput, onApplyPromo }: OrderSummaryProps) {
  return (
    <div className="rounded-3xl bg-surface p-6 ring-1 ring-ink/15">
      <h2 className="display text-2xl">Order summary</h2>
      <ul className="mt-4 divide-y divide-line">
        {lines.map((l) => {
          const p = l.snapshot;
          return (
            <li key={l.key} className="flex items-center gap-3 py-3">
              <div className="relative size-14 shrink-0 overflow-hidden">
                <Photo src={p.image} alt={p.name} w={160} className="h-full w-full" />
                <span className="absolute -right-0 -top-0 grid size-5 place-items-center rounded-bl-lg bg-ink text-[11px] text-white">{l.qty}</span>
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-medium">{p.name}</p>
                <p className="text-muted">
                  {l.color} · {l.size}
                </p>
              </div>
              <p className="text-sm font-medium tabular-nums">{formatKES(lineTotal(l))}</p>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex gap-2">
        <label className="sr-only" htmlFor="promo">
          Promo code
        </label>
        <input id="promo" className="field h-11 min-h-11 flex-1 text-sm" placeholder="Promo code" value={promoInput} onChange={(e) => onPromoInput(e.target.value)} />
        <button className="btn-ghost h-11 min-h-11 px-5" onClick={onApplyPromo} type="button">
          Apply
        </button>
      </div>
      {promoError && <p className="mt-1 text-sm text-danger">{promoError}</p>}
      {promoApplied && (
        <p className="mt-1 text-sm text-mpesa">
          {PROMO.code} applied: {PROMO.percent}% off.
        </p>
      )}

      <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm tabular-nums">
        <div className="flex justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd>{formatKES(subtotal)}</dd>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-mpesa">
            <dt>Discount</dt>
            <dd>-{formatKES(discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted">Delivery</dt>
          <dd>{method === "pickup" ? "Free" : hasZone ? (delivery === 0 ? "Free" : formatKES(delivery)) : "Choose county"}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold">
          <dt>Total</dt>
          <dd>{formatKES(total)}</dd>
        </div>
      </dl>
    </div>
  );
}

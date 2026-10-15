import type { OrderSummaryProps } from "@/features/checkout/models";
import { formatKES } from "@/lib/format";
import { lineTotal } from "@/services/pricing";
import { promoReasonMessage } from "@/lib/promo";
import { Photo } from "@/components/ui/Photo";

/** Order totals as the server priced them. While it has not answered, amounts show a dash rather than a guess. */
export function OrderSummary({ lines, quote, updating, giftFee, method, hasZone, promoInput, promoSent, onPromoInput, onApplyPromo }: OrderSummaryProps) {
  const money = (n: number | undefined) => (n === undefined ? "..." : formatKES(n));
  const promo = quote?.promo;
  const promoError = promo && !promo.valid ? promoReasonMessage(promo.reason) : "";
  const applied = quote?.applied.find((a) => a.code && promo?.valid && a.code.toUpperCase() === promo.code.toUpperCase());
  const automatic = quote?.applied.filter((a) => !a.code) ?? [];

  return (
    <div className="rounded-3xl bg-surface p-6 ring-1 ring-ink/15" aria-busy={updating}>
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
              <p className="text-sm font-medium tabular-nums">{formatKES(lineTotal(l, quote?.giftFee ?? giftFee))}</p>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex gap-2">
        <label className="sr-only" htmlFor="promo">
          Promo code
        </label>
        <input
          id="promo"
          className="field h-11 min-h-11 flex-1 text-sm"
          placeholder="Promo code"
          value={promoInput}
          onChange={(e) => onPromoInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onApplyPromo();
            }
          }}
        />
        <button className="btn-ghost h-11 min-h-11 px-5" onClick={onApplyPromo} type="button">
          Apply
        </button>
      </div>
      {promoSent && promoError && <p className="mt-1 text-sm text-danger">{promoError}</p>}
      {promoSent && applied && (
        <p className="mt-1 text-sm text-mpesa">
          {applied.name} applied{applied.amount > 0 ? `: -${formatKES(applied.amount)}` : applied.freeDelivery ? ": free delivery" : ""}.
        </p>
      )}
      {automatic.map((a) => (
        <p key={a.name} className="mt-1 text-sm text-mpesa">
          {a.name}: {a.freeDelivery && a.amount === 0 ? "free delivery" : `-${formatKES(a.amount)}`}
        </p>
      ))}

      <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm tabular-nums">
        <div className="flex justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd>{money(quote?.subtotal)}</dd>
        </div>
        {quote && quote.discount > 0 && (
          <div className="flex justify-between text-mpesa">
            <dt>Discount</dt>
            <dd>-{formatKES(quote.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted">Delivery</dt>
          <dd>{method === "pickup" ? "Free" : !hasZone ? "Choose county" : !quote ? "..." : quote.deliveryFee === 0 ? "Free" : formatKES(quote.deliveryFee)}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold">
          <dt>Total</dt>
          <dd>{money(quote?.total)}</dd>
        </div>
        {quote?.vat && (
          <div className="flex justify-between text-muted">
            <dt>Includes VAT ({quote.vat.ratePercent}%)</dt>
            <dd>{formatKES(quote.vat.amount)}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

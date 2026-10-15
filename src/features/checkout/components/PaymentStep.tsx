import { Check } from "@phosphor-icons/react";
import type { PaymentStepProps } from "@/features/checkout/models";
import { formatKES } from "@/lib/format";
import { Field } from "@/components/ui/Field";

/** Step 2: pick a payment method and enter the details it needs. */
export function PaymentStep({ options, pay, onPay, codAllowed, payPhone, onPayPhone, card, onCard, errors, total }: PaymentStepProps) {
  return (
    <section className="space-y-6" aria-label="Payment method">
      <h2 className="display text-3xl">How would you like to pay?</h2>
      <div className="space-y-3" role="radiogroup" aria-label="Payment method">
        {options.map((o) => {
          const disabled = o.id === "cod" && !codAllowed;
          return (
            <button
              key={o.id}
              role="radio"
              aria-checked={pay === o.id}
              disabled={disabled}
              onClick={() => onPay(o.id)}
              className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${pay === o.id ? "border-ink bg-surface ring-1 ring-ink" : "border-line bg-surface hover:border-ink/40"} disabled:opacity-45`}
            >
              <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${o.id === "mpesa" ? "bg-mpesa text-paper" : "bg-ink/5"}`}>
                <o.icon size={26} />
              </span>
              <span className="flex-1">
                <span className="block font-medium">
                  {o.label} {o.id === "mpesa" && <span className="ml-1 bg-mpesa/10 px-2 py-0.5 text-xs font-medium text-mpesa">Most popular</span>}
                </span>
                <span className="text-sm text-muted">{disabled ? "Not offered for this delivery area." : o.hint}</span>
              </span>
              <span aria-hidden="true" className={`grid size-6 shrink-0 place-items-center rounded-md border-2 transition ${pay === o.id ? "border-ink bg-ink text-on-ink" : "border-line"}`}>
                {pay === o.id && <Check size={16} weight="bold" />}
              </span>
            </button>
          );
        })}
      </div>

      {(pay === "mpesa" || pay === "airtel") && (
        <Field label={pay === "mpesa" ? "M-Pesa number" : "Airtel Money number"} htmlFor="payPhone" error={errors.payPhone} hint="You will get a prompt on this number. Make sure it has enough balance.">
          <input id="payPhone" type="tel" inputMode="tel" placeholder="0712 345 678" className={`field ${errors.payPhone ? "field-error" : ""}`} value={payPhone} onChange={(e) => onPayPhone(e.target.value)} />
        </Field>
      )}
      {pay === "card" && (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Card number" htmlFor="cardNumber" error={errors.cardNumber}>
              <input id="cardNumber" inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" className={`field ${errors.cardNumber ? "field-error" : ""}`} value={card.number} onChange={(e) => onCard({ ...card, number: e.target.value.replace(/[^\d ]/g, "").slice(0, 19) })} />
            </Field>
          </div>
          <Field label="Expiry" htmlFor="cardExp" error={errors.cardExp}>
            <input id="cardExp" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" className={`field ${errors.cardExp ? "field-error" : ""}`} value={card.exp} onChange={(e) => onCard({ ...card, exp: e.target.value.replace(/[^\d/]/g, "").slice(0, 5) })} />
          </Field>
          <Field label="CVC" htmlFor="cardCvc" error={errors.cardCvc}>
            <input id="cardCvc" inputMode="numeric" autoComplete="cc-csc" placeholder="123" className={`field ${errors.cardCvc ? "field-error" : ""}`} value={card.cvc} onChange={(e) => onCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })} />
          </Field>
        </div>
      )}
      {pay === "cod" && <p className="rounded-xl bg-accent/30 p-4 text-sm">Pay {formatKES(total)} in cash or M-Pesa when your order arrives. You can try everything on first.</p>}
    </section>
  );
}

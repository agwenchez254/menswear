import { MapPin, Storefront, Truck } from "@phosphor-icons/react";
import type { DeliveryMethod } from "@/models";
import type { DeliveryStepProps } from "@/features/checkout/models";
import { allCounties } from "@/data/delivery";
import { PICKUP_ADDRESS } from "@/config/commerce";
import { formatKES } from "@/lib/format";
import { Field } from "@/components/ui/Field";

const METHODS: { id: DeliveryMethod; label: string; hint: string; icon: typeof Truck }[] = [
  { id: "delivery", label: "Home or office delivery", hint: "Across all 47 counties", icon: Truck },
  { id: "pickup", label: "Collect at our studio", hint: "Free. Ready in 2 hours", icon: Storefront },
];

/** Step 1: choose delivery or pickup, then contact and address details. */
export function DeliveryStep({ method, onMethod, form, onField, errors, zone, delivery }: DeliveryStepProps) {
  return (
    <section className="space-y-8" aria-label="Delivery details">
      <div>
        <h2 className="display text-3xl">How should we get it to you?</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Delivery method">
          {METHODS.map(({ id, label, hint, icon: Icon }) => (
            <button
              key={id}
              role="radio"
              aria-checked={method === id}
              onClick={() => onMethod(id)}
              className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${method === id ? "border-ink bg-surface ring-1 ring-ink" : "border-line bg-surface hover:border-ink/40"}`}
            >
              <Icon size={26} className="mt-0.5 text-ink" />
              <span>
                <span className="block font-medium">{label}</span>
                <span className="text-sm text-muted">{hint}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="name" error={errors.name}>
          <input id="name" autoComplete="name" className={`field ${errors.name ? "field-error" : ""}`} value={form.name} onChange={onField("name")} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-err" : undefined} />
        </Field>
        <Field label="Phone number" htmlFor="phone" error={errors.phone} hint="We call or text this number on delivery day.">
          <input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" className={`field ${errors.phone ? "field-error" : ""}`} value={form.phone} onChange={onField("phone")} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "phone-err" : undefined} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Email (optional)" htmlFor="email" error={errors.email} hint="For your receipt. Leave blank to get it by SMS only.">
            <input id="email" type="email" inputMode="email" autoComplete="email" className={`field ${errors.email ? "field-error" : ""}`} value={form.email} onChange={onField("email")} />
          </Field>
        </div>
      </div>

      {method === "delivery" ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="County" htmlFor="county" error={errors.county}>
            <select id="county" className={`field ${errors.county ? "field-error" : ""}`} value={form.county} onChange={onField("county")}>
              <option value="">Select county</option>
              {allCounties.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Town or estate" htmlFor="area" error={errors.area}>
            <input id="area" autoComplete="address-level2" placeholder="e.g. Kilimani" className={`field ${errors.area ? "field-error" : ""}`} value={form.area} onChange={onField("area")} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Street, building or landmark" htmlFor="street" error={errors.street}>
              <input id="street" autoComplete="street-address" placeholder="e.g. Argwings Kodhek Rd, next to Yaya Centre" className={`field ${errors.street ? "field-error" : ""}`} value={form.street} onChange={onField("street")} />
            </Field>
          </div>
          {zone && (
            <p className="flex items-start gap-2 rounded-xl bg-accent/30 p-4 text-sm sm:col-span-2">
              <MapPin size={20} className="mt-0.5 shrink-0 text-ink" />
              <span>
                <strong>{zone.label}:</strong> {delivery === 0 ? "free delivery" : formatKES(zone.fee)}. {zone.eta}.
              </span>
            </p>
          )}
        </div>
      ) : (
        <p className="flex items-start gap-2 rounded-xl bg-accent/30 p-4 text-sm">
          <Storefront size={20} className="mt-0.5 shrink-0 text-ink" /> {PICKUP_ADDRESS}. Open Mon to Sat, 9 am to 7 pm.
        </p>
      )}
    </section>
  );
}

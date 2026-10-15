import type { ReviewStepProps } from "@/features/checkout/models";
import { PAY_OPTIONS } from "@/features/checkout/constants";
import { useSiteSettings } from "@/api/settings";
import { normalizePhone } from "@/lib/phone";

/** Step 3: read everything back, jump to a step to edit it, and leave a note for the rider. */
export function ReviewStep({ form, method, eta, pay, payPhone, onEdit, onField }: ReviewStepProps) {
  const { pickupAddress } = useSiteSettings();
  const pickup = method === "pickup";
  const mobileMoney = pay === "mpesa" || pay === "airtel";
  const payLabel = PAY_OPTIONS.find((o) => o.id === pay)?.label ?? "";

  const rows = [
    { label: "Contact", value: `${form.name}, ${normalizePhone(form.phone)}${form.email ? `, ${form.email}` : ""}`, step: 1 as const },
    { label: pickup ? "Pickup" : "Deliver to", value: pickup ? pickupAddress : `${form.street}, ${form.area}, ${form.county}`, step: 1 as const },
    { label: "Arrives", value: pickup ? "Ready in 2 hours" : (eta ?? ""), step: 1 as const },
    { label: "Payment", value: payLabel + (mobileMoney ? `, ${normalizePhone(payPhone)}` : ""), step: 2 as const },
  ];

  return (
    <section className="space-y-6" aria-label="Review your order">
      <h2 className="display text-3xl">Check everything looks right</h2>
      <dl className="divide-y divide-line rounded-3xl bg-surface ring-1 ring-ink/15">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-4 p-5">
            <div>
              <dt className="text-sm text-muted">{r.label}</dt>
              <dd className="mt-0.5 font-medium">{r.value}</dd>
            </div>
            <button className="text-sm underline underline-offset-4" onClick={() => onEdit(r.step)}>
              Edit
            </button>
          </div>
        ))}
      </dl>
      <div>
        <label htmlFor="notes" className="label">
          Notes for the rider (optional)
        </label>
        <textarea id="notes" rows={2} className="field mt-2 py-3" value={form.notes} onChange={onField("notes")} placeholder="Gate colour, call on arrival..." />
      </div>
    </section>
  );
}

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { WarningCircle } from "@phosphor-icons/react";
import { isNotFound } from "@/api/baseApi";
import { useTrackOrderQuery } from "@/api/orders";
import { Field } from "@/components/ui/Field";
import { formatKES } from "@/lib/format";
import { normalizePhone } from "@/lib/phone";
import { useAppSelector } from "@/store/hooks";

const POLL_MS = 15_000;
const FINISHED = new Set(["delivered", "cancelled", "refunded"]);

const STEP_LABELS: Record<string, string> = {
  created: "Order placed",
  paid: "Payment received",
  packed: "Packed",
  shipped: "On its way",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

/** Look up an order by its number and the phone number it was placed with. No account needed. */
export default function TrackOrderPage() {
  const { id } = useParams();
  const [number, setNumber] = useState(id ?? "");
  const account = useAppSelector((s) => s.auth.user);
  const [phone, setPhone] = useState(account?.phone ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lookup, setLookup] = useState<{ number: string; phone: string } | null>(null);
  const [live, setLive] = useState(true);
  // Re-checks every 15 seconds while the order is still moving, so the timeline updates without a reload.
  const { data: order, isFetching, error } = useTrackOrderQuery(lookup ?? { number: "", phone: "" }, { skip: !lookup, pollingInterval: live ? POLL_MS : 0 });

  // Signed in and arriving with an order number (e.g. from the order page): no need to type the phone again.
  useEffect(() => {
    const own = normalizePhone(account?.phone ?? "");
    if (id && own) setLookup({ number: id.toUpperCase(), phone: own });
  }, [id, account?.phone]);

  if (order && live && FINISHED.has(order.status)) setLive(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (number.trim().length < 5) found.number = "Enter the order number, like JB-000123.";
    if (!normalizePhone(phone)) found.phone = "Enter the phone number the order was placed with.";
    setErrors(found);
    if (Object.keys(found).length) return;
    setLive(true);
    setLookup({ number: number.trim().toUpperCase(), phone: normalizePhone(phone) as string });
  };

  return (
    <section aria-labelledby="track-title" className="mx-auto max-w-xl px-4 pb-10 pt-14 md:pt-20">
      <h1 id="track-title" className="display text-5xl">
        Track an order
      </h1>
      <p className="mt-3 text-muted">Enter your order number and the phone number you used. The status updates by itself while your order is on its way.</p>
      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
        <Field label="Order number" htmlFor="track-number" error={errors.number}>
          <input id="track-number" className="field" placeholder="JB-000123" value={number} onChange={(e) => setNumber(e.target.value)} />
        </Field>
        <Field label="Phone number" htmlFor="track-phone" error={errors.phone}>
          <input id="track-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <button type="submit" disabled={isFetching} className="btn-dark h-14 w-full text-base disabled:opacity-60">
          {isFetching ? "Looking..." : "Find my order"}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-6 flex items-center gap-2 text-sm text-danger">
          <WarningCircle size={16} /> {isNotFound(error) ? "We could not find an order with those details." : "Something went wrong. Try again."}
        </p>
      )}

      {order && !error && (
        <div className="mt-10 rounded-3xl bg-surface p-6 ring-1 ring-ink/15">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="display text-2xl">{order.number}</h2>
            <span className="text-sm capitalize text-muted">{order.status}</span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {order.method === "pickup" ? "Studio pickup" : `Delivery to ${order.county ?? "your address"}`}
            {order.eta ? `. ${order.eta}` : ""}
          </p>
          <ol className="mt-5 space-y-2 border-l border-line pl-4 text-sm">
            {order.timeline.map((t) => (
              <li key={`${t.type}-${t.at}`}>
                <span className="font-medium">{STEP_LABELS[t.type] ?? t.type}</span>
                <span className="ml-2 text-muted">{new Date(t.at).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}</span>
              </li>
            ))}
          </ol>
          <ul className="mt-5 divide-y divide-line border-y border-line text-sm">
            {order.lines.map((l, i) => (
              <li key={i} className="flex justify-between gap-3 py-3">
                <span>
                  {l.name}{" "}
                  <span className="text-muted">
                    x {l.qty} · {l.colour}, {l.size}
                  </span>
                </span>
                <span className="tabular-nums">{formatKES(l.unitPrice * l.qty)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex justify-between text-lg font-semibold tabular-nums">
            <span>Total</span>
            <span>{formatKES(order.total)}</span>
          </p>
          <p className="text-sm text-muted">{order.paymentStatus === "paid" ? "Paid" : order.paymentMethod === "cod" ? "To pay on delivery" : "Waiting for payment"}</p>
        </div>
      )}
    </section>
  );
}

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Bank, CheckCircle, CreditCard, DeviceMobile, HandCoins, MapPin, Storefront, Truck, WarningCircle } from "@phosphor-icons/react";
import { cartSubtotal, lineTotal, useCart, type Order } from "../store/cart";
import { byId, formatKES } from "../data/products";
import { PICKUP_ADDRESS, allCounties, normalizePhone, zoneFor } from "../data/delivery";
import { Photo } from "../components/Photo";

type Step = 1 | 2 | 3;
type Method = "delivery" | "pickup";
type Pay = "mpesa" | "airtel" | "card" | "cod";

const FREE_NAIROBI_OVER = 10000;
const PROMO = { code: "JABALI10", pct: 10 };

const payOptions: { id: Pay; label: string; hint: string; icon: typeof DeviceMobile }[] = [
  { id: "mpesa", label: "M-Pesa", hint: "STK push to your phone. Enter your PIN to pay.", icon: DeviceMobile },
  { id: "airtel", label: "Airtel Money", hint: "Approve the prompt on your Airtel line.", icon: Bank },
  { id: "card", label: "Card", hint: "Visa or Mastercard.", icon: CreditCard },
  { id: "cod", label: "Pay on delivery", hint: "Nairobi only. Cash or M-Pesa to the rider.", icon: HandCoins },
];

function Field({ label, error, hint, children, htmlFor }: { label: string; error?: string; hint?: string; children: ReactNode; htmlFor: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-err`} role="alert" className="flex items-center gap-1 text-sm text-danger">
          <WarningCircle size={16} /> {error}
        </p>
      ) : (
        hint && <p className="text-sm text-muted">{hint}</p>
      )}
    </div>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const { lines, clear, setLastOrder } = useCart();
  const [step, setStep] = useState<Step>(1);
  const [method, setMethod] = useState<Method>("delivery");
  const [form, setForm] = useState({ name: "", phone: "", email: "", county: "", area: "", street: "", notes: "" });
  const [pay, setPay] = useState<Pay>("mpesa");
  const [payPhone, setPayPhone] = useState("");
  const [card, setCard] = useState({ number: "", exp: "", cvc: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState(false);
  const [promoErr, setPromoErr] = useState("");
  const [phase, setPhase] = useState<"form" | "pending" | "failed">("form");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step, phase]);

  const subtotal = cartSubtotal(lines);
  const zone = zoneFor(form.county);
  const discount = promo ? Math.round((subtotal * PROMO.pct) / 100) : 0;
  const delivery = useMemo(() => {
    if (method === "pickup") return 0;
    if (!zone) return 0;
    if (zone.id === "nairobi" && subtotal >= FREE_NAIROBI_OVER) return 0;
    return zone.fee;
  }, [method, zone, subtotal]);
  const total = subtotal - discount + delivery;
  const codAllowed = method === "pickup" || zone?.id === "nairobi";
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (pay === "cod" && !codAllowed) setPay("mpesa");
  }, [codAllowed, pay]);

  useEffect(() => {
    if (!payPhone && form.phone) setPayPhone(form.phone);
  }, [form.phone, payPhone]);

  if (lines.length === 0 && phase === "form") {
    return (
      <div className="mx-auto max-w-xl px-4 py-32 text-center">
        <h1 className="display text-5xl">Your bag is empty</h1>
        <p className="mt-3 text-muted">Add something to your bag to check out.</p>
        <Link to="/shop" className="btn-dark mt-8">
          Browse the shop
        </Link>
      </div>
    );
  }

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 3) e.name = "Enter your full name.";
    if (!normalizePhone(form.phone)) e.phone = "Enter a valid Kenyan number, like 0712 345 678.";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "That email does not look right.";
    if (method === "delivery") {
      if (!form.county) e.county = "Choose your county.";
      if (form.area.trim().length < 2) e.area = "Enter your town or estate.";
      if (form.street.trim().length < 3) e.street = "Add a street, building or landmark so the rider can find you.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if ((pay === "mpesa" || pay === "airtel") && !normalizePhone(payPhone)) e.payPhone = `Enter the ${pay === "mpesa" ? "Safaricom" : "Airtel"} number to charge.`;
    if (pay === "card") {
      if (card.number.replace(/\s/g, "").length < 15) e.cardNumber = "Enter the 16-digit card number.";
      if (!/^\d{2}\/\d{2}$/.test(card.exp)) e.cardExp = "Use MM/YY.";
      if (card.cvc.length < 3) e.cardCvc = "3 digits.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const applyPromo = () => {
    if (promoInput.trim().toUpperCase() === PROMO.code) {
      setPromo(true);
      setPromoErr("");
    } else setPromoErr("That code is not valid.");
  };

  const placeOrder = () => {
    if (pay === "mpesa" || pay === "airtel") {
      setPhase("pending");
      // Simulated gateway callback. Replace with a poll against your payments API.
      timer.current = setTimeout(() => finish(), 6000);
    } else finish();
  };

  const finish = () => {
    const order: Order = {
      id: `JB-${Math.floor(100000 + Math.random() * 899999)}`,
      placedAt: new Date().toISOString(),
      lines,
      subtotal,
      delivery,
      discount,
      total,
      method: method === "pickup" ? "Studio pickup" : `Delivery to ${form.area}, ${form.county}`,
      payment: payOptions.find((p) => p.id === pay)!.label,
      name: form.name,
      phone: normalizePhone(form.phone) ?? form.phone,
      address: method === "pickup" ? PICKUP_ADDRESS : `${form.street}, ${form.area}, ${form.county}`,
      eta: method === "pickup" ? "Ready for pickup in 2 hours" : (zone?.eta ?? "2 to 5 working days"),
    };
    setLastOrder(order);
    clear();
    navigate(`/order/${order.id}`);
  };

  const steps = ["Delivery", "Payment", "Review"];

  const summary = (
    <div className="rounded-3xl bg-surface p-6 ring-1 ring-ink/15">
      <h2 className="display text-2xl">Order summary</h2>
      <ul className="mt-4 divide-y divide-line">
        {lines.map((l) => {
          const p = byId(l.productId);
          if (!p) return null;
          return (
            <li key={l.key} className="flex items-center gap-3 py-3">
              <div className="relative size-14 shrink-0 overflow-hidden">
                <Photo id={p.images[0]} alt={p.name} w={160} className="h-full w-full" />
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
        <input id="promo" className="field h-11 min-h-11 flex-1 text-sm" placeholder="Promo code" value={promoInput} onChange={(e) => setPromoInput(e.target.value)} />
        <button className="btn-ghost h-11 min-h-11 px-5" onClick={applyPromo} type="button">
          Apply
        </button>
      </div>
      {promoErr && <p className="mt-1 text-sm text-danger">{promoErr}</p>}
      {promo && <p className="mt-1 text-sm text-mpesa">{PROMO.code} applied: {PROMO.pct}% off.</p>}

      <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm tabular-nums">
        <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatKES(subtotal)}</dd></div>
        {discount > 0 && <div className="flex justify-between text-mpesa"><dt>Discount</dt><dd>-{formatKES(discount)}</dd></div>}
        <div className="flex justify-between">
          <dt className="text-muted">Delivery</dt>
          <dd>{method === "pickup" ? "Free" : zone ? (delivery === 0 ? "Free" : formatKES(delivery)) : "Choose county"}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold"><dt>Total</dt><dd>{formatKES(total)}</dd></div>
      </dl>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-10 pt-8 md:px-8 md:pt-12">
      <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} /> Continue shopping
      </Link>
      <h1 className="mt-4 display text-5xl">Checkout</h1>

      <ol className="mt-8 flex items-center gap-2 text-sm" aria-label="Checkout progress">
        {steps.map((s, i) => {
          const n = i + 1;
          const done = step > n;
          const active = step === n;
          return (
            <li key={s} className="flex flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
              <span className={`grid size-8 shrink-0 place-items-center text-xs font-semibold ${done ? "bg-mpesa text-paper" : active ? "bg-ink text-on-ink" : "bg-ink/10 text-muted"}`}>{done ? <CheckCircle size={18} weight="fill" /> : n}</span>
              <span className={`${active ? "font-medium" : "text-muted"} max-sm:hidden`}>{s}</span>
              {n < 3 && <span className={`h-px flex-1 ${done ? "bg-mpesa" : "bg-line"}`} />}
            </li>
          );
        })}
        <li className="ml-2 text-xs text-muted sm:hidden">Step {step} of 3</li>
      </ol>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div>
          <AnimatePresence mode="wait">
            {phase === "pending" ? (
              <motion.div key="pending" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-3xl bg-surface p-8 text-center ring-1 ring-ink/15 md:p-12" role="status" aria-live="polite">
                <div className="relative mx-auto grid size-24 place-items-center">
                  <motion.span className="absolute inset-0 rounded-full bg-mpesa/20" animate={{ scale: [1, 1.5], opacity: [0.6, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />
                  <span className="relative grid size-20 place-items-center rounded-full bg-mpesa text-paper">
                    <DeviceMobile size={36} />
                  </span>
                </div>
                <h2 className="mt-6 display text-4xl">Check your phone</h2>
                <p className="mx-auto mt-3 max-w-[40ch] text-muted">
                  We sent a payment request for <strong className="text-ink">{formatKES(total)}</strong> to <strong className="text-ink">{normalizePhone(payPhone)}</strong>. Enter your {pay === "mpesa" ? "M-Pesa" : "Airtel Money"} PIN to complete.
                </p>
                <div className="mx-auto mt-6 h-1.5 w-56 overflow-hidden bg-ink/10">
                  <motion.div className="h-full bg-mpesa" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 6, ease: "linear" }} />
                </div>
                <button className="mt-8 text-sm text-muted underline underline-offset-4 hover:text-ink" onClick={() => { clearTimeout(timer.current); setPhase("form"); }}>
                  Cancel and change payment method
                </button>
              </motion.div>
            ) : (
              <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
                {step === 1 && (
                  <section className="space-y-8" aria-label="Delivery details">
                    <div>
                      <h2 className="display text-3xl">How should we get it to you?</h2>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Delivery method">
                        {([
                          ["delivery", "Home or office delivery", "Across all 47 counties", Truck],
                          ["pickup", "Collect at our studio", "Free. Ready in 2 hours", Storefront],
                        ] as const).map(([id, l, h, Icon]) => (
                          <button key={id} role="radio" aria-checked={method === id} onClick={() => setMethod(id)} className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${method === id ? "border-ink bg-surface ring-1 ring-ink" : "border-line bg-surface hover:border-ink/40"}`}>
                            <Icon size={26} className="mt-0.5 text-ink" />
                            <span>
                              <span className="block font-medium">{l}</span>
                              <span className="text-sm text-muted">{h}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Full name" htmlFor="name" error={errors.name}>
                        <input id="name" autoComplete="name" className={`field ${errors.name ? "field-error" : ""}`} value={form.name} onChange={set("name")} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-err" : undefined} />
                      </Field>
                      <Field label="Phone number" htmlFor="phone" error={errors.phone} hint="We call or text this number on delivery day.">
                        <input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" className={`field ${errors.phone ? "field-error" : ""}`} value={form.phone} onChange={set("phone")} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "phone-err" : undefined} />
                      </Field>
                      <div className="sm:col-span-2">
                        <Field label="Email (optional)" htmlFor="email" error={errors.email} hint="For your receipt. Leave blank to get it by SMS only.">
                          <input id="email" type="email" inputMode="email" autoComplete="email" className={`field ${errors.email ? "field-error" : ""}`} value={form.email} onChange={set("email")} />
                        </Field>
                      </div>
                    </div>

                    {method === "delivery" ? (
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="County" htmlFor="county" error={errors.county}>
                          <select id="county" className={`field ${errors.county ? "field-error" : ""}`} value={form.county} onChange={set("county")}>
                            <option value="">Select county</option>
                            {allCounties.map((c) => (
                              <option key={c}>{c}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Town or estate" htmlFor="area" error={errors.area}>
                          <input id="area" autoComplete="address-level2" placeholder="e.g. Kilimani" className={`field ${errors.area ? "field-error" : ""}`} value={form.area} onChange={set("area")} />
                        </Field>
                        <div className="sm:col-span-2">
                          <Field label="Street, building or landmark" htmlFor="street" error={errors.street}>
                            <input id="street" autoComplete="street-address" placeholder="e.g. Argwings Kodhek Rd, next to Yaya Centre" className={`field ${errors.street ? "field-error" : ""}`} value={form.street} onChange={set("street")} />
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
                )}

                {step === 2 && (
                  <section className="space-y-6" aria-label="Payment method">
                    <h2 className="display text-3xl">How would you like to pay?</h2>
                    <div className="space-y-3" role="radiogroup" aria-label="Payment method">
                      {payOptions.map((o) => {
                        const disabled = o.id === "cod" && !codAllowed;
                        return (
                          <button key={o.id} role="radio" aria-checked={pay === o.id} disabled={disabled} onClick={() => setPay(o.id)} className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${pay === o.id ? "border-ink bg-surface ring-1 ring-ink" : "border-line bg-surface hover:border-ink/40"} disabled:opacity-45`}>
                            <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${o.id === "mpesa" ? "bg-mpesa text-paper" : "bg-ink/5"}`}>
                              <o.icon size={26} />
                            </span>
                            <span className="flex-1">
                              <span className="block font-medium">
                                {o.label} {o.id === "mpesa" && <span className="ml-1 bg-mpesa/10 px-2 py-0.5 text-xs font-medium text-mpesa">Most popular</span>}
                              </span>
                              <span className="text-sm text-muted">{disabled ? "Only available for Nairobi delivery or studio pickup." : o.hint}</span>
                            </span>
                            <span className={`size-5 border-2 ${pay === o.id ? "border-ink bg-ink ring-2 ring-inset ring-paper" : "border-line"}`} />
                          </button>
                        );
                      })}
                    </div>

                    {(pay === "mpesa" || pay === "airtel") && (
                      <Field label={pay === "mpesa" ? "M-Pesa number" : "Airtel Money number"} htmlFor="payPhone" error={errors.payPhone} hint="You will get a prompt on this number. Make sure it has enough balance.">
                        <input id="payPhone" type="tel" inputMode="tel" placeholder="0712 345 678" className={`field ${errors.payPhone ? "field-error" : ""}`} value={payPhone} onChange={(e) => setPayPhone(e.target.value)} />
                      </Field>
                    )}
                    {pay === "card" && (
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <Field label="Card number" htmlFor="cardNumber" error={errors.cardNumber}>
                            <input id="cardNumber" inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" className={`field ${errors.cardNumber ? "field-error" : ""}`} value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value.replace(/[^\d ]/g, "").slice(0, 19) })} />
                          </Field>
                        </div>
                        <Field label="Expiry" htmlFor="cardExp" error={errors.cardExp}>
                          <input id="cardExp" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" className={`field ${errors.cardExp ? "field-error" : ""}`} value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value.replace(/[^\d/]/g, "").slice(0, 5) })} />
                        </Field>
                        <Field label="CVC" htmlFor="cardCvc" error={errors.cardCvc}>
                          <input id="cardCvc" inputMode="numeric" autoComplete="cc-csc" placeholder="123" className={`field ${errors.cardCvc ? "field-error" : ""}`} value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })} />
                        </Field>
                      </div>
                    )}
                    {pay === "cod" && <p className="rounded-xl bg-accent/30 p-4 text-sm">Pay {formatKES(total)} in cash or M-Pesa when your order arrives. You can try everything on first.</p>}
                  </section>
                )}

                {step === 3 && (
                  <section className="space-y-6" aria-label="Review your order">
                    <h2 className="display text-3xl">Check everything looks right</h2>
                    <dl className="divide-y divide-line rounded-3xl bg-surface ring-1 ring-ink/15">
                      {[
                        ["Contact", `${form.name}, ${normalizePhone(form.phone)}${form.email ? `, ${form.email}` : ""}`, 1],
                        [method === "pickup" ? "Pickup" : "Deliver to", method === "pickup" ? PICKUP_ADDRESS : `${form.street}, ${form.area}, ${form.county}`, 1],
                        ["Arrives", method === "pickup" ? "Ready in 2 hours" : (zone?.eta ?? ""), 1],
                        ["Payment", payOptions.find((o) => o.id === pay)!.label + (pay === "mpesa" || pay === "airtel" ? `, ${normalizePhone(payPhone)}` : ""), 2],
                      ].map(([k, v, s]) => (
                        <div key={k as string} className="flex items-start justify-between gap-4 p-5">
                          <div>
                            <dt className="text-sm text-muted">{k}</dt>
                            <dd className="mt-0.5 font-medium">{v}</dd>
                          </div>
                          <button className="text-sm underline underline-offset-4" onClick={() => setStep(s as Step)}>
                            Edit
                          </button>
                        </div>
                      ))}
                    </dl>
                    <div>
                      <label htmlFor="notes" className="label">
                        Notes for the rider (optional)
                      </label>
                      <textarea id="notes" rows={2} className="field mt-2 py-3" value={form.notes} onChange={set("notes")} placeholder="Gate colour, call on arrival..." />
                    </div>
                  </section>
                )}

                <div className="mt-10 flex items-center justify-between gap-3">
                  {step > 1 ? (
                    <button className="btn-ghost" onClick={() => setStep((s) => (s - 1) as Step)}>
                      <ArrowLeft size={16} /> Back
                    </button>
                  ) : (
                    <span />
                  )}
                  {step < 3 ? (
                    <button className="btn-dark h-14 px-10 text-base" onClick={next}>
                      Continue
                    </button>
                  ) : (
                    <button className="btn-accent h-14 px-10 text-base" onClick={placeOrder}>
                      {pay === "cod" ? "Place order" : `Pay ${formatKES(total)}`}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="lg:sticky lg:top-32 lg:self-start">{summary}</aside>
      </div>
    </div>
  );
}

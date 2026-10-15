import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft } from "@phosphor-icons/react";
import type { DeliveryMethod, Order } from "@/models";
import type { CardForm, CheckoutPhase, CheckoutStep, ContactForm, FormErrors, PaymentMethod } from "@/features/checkout/models";
import { useCart } from "@/store/cart";
import { useAppSelector } from "@/store/hooks";
import { orderPath, ROUTES } from "@/config/routes";
import { errorMessage } from "@/api/baseApi";
import { useGetZonesQuery } from "@/api/delivery";
import { useCartQuote } from "@/api/quote";
import { useLazyGetOrderStatusQuery, usePlaceOrderMutation, type PlaceOrderInput } from "@/api/orders";
import { useSiteSettings } from "@/api/settings";
import { useCreateAddressMutation, useDeleteAddressMutation, useGetAddressesQuery } from "@/api/addresses";
import { formatKES } from "@/lib/format";
import { normalizePhone } from "@/lib/phone";
import { CHECKOUT_STEPS, EMPTY_CONTACT, MOBILE_PAYMENT_WAIT_MS, PAY_OPTIONS, PAYMENT_POLL_MS } from "@/features/checkout/constants";
import { isValid, validateContact, validatePayment } from "@/features/checkout/validation";
import { OrderSummary } from "@/features/checkout/components/OrderSummary";
import { StepIndicator } from "@/features/checkout/components/StepIndicator";
import { PendingPayment } from "@/features/checkout/components/PendingPayment";
import { NEW_ADDRESS } from "@/features/checkout/components/SavedAddresses";
import { DeliveryStep } from "@/features/checkout/components/DeliveryStep";
import { PaymentStep } from "@/features/checkout/components/PaymentStep";
import { ReviewStep } from "@/features/checkout/components/ReviewStep";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { lines, clear, setLastOrder } = useCart();
  const placed = useRef<{ sig: string; key: string }>(undefined);
  const [step, setStep] = useState<CheckoutStep>(1);
  const [method, setMethod] = useState<DeliveryMethod>("delivery");
  const account = useAppSelector((s) => s.auth.user);
  const [form, setForm] = useState<ContactForm>(() => ({
    ...EMPTY_CONTACT,
    name: account?.name ?? "",
    phone: account?.phone ?? "",
    email: account?.email ?? "",
  }));
  const { paymentMethods, giftFee } = useSiteSettings();
  const { data: zones = [] } = useGetZonesQuery();
  const [placeOrderCall] = usePlaceOrderMutation();
  const [fetchStatus] = useLazyGetOrderStatusQuery();
  const [submitError, setSubmitError] = useState("");
  const { data: saved = [] } = useGetAddressesQuery();
  const [createAddress] = useCreateAddressMutation();
  const [deleteAddress, { isLoading: deleting }] = useDeleteAddressMutation();
  const [placeId, setPlaceId] = useState<string | null>(null); // null until the saved places have loaded
  const [savePlace, setSavePlace] = useState(false);
  const [placeLabel, setPlaceLabel] = useState("");
  const [pay, setPay] = useState<PaymentMethod>("mpesa");
  const [payPhone, setPayPhone] = useState("");
  const [card, setCard] = useState<CardForm>({ number: "", exp: "", cvc: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [promoInput, setPromoInput] = useState("");
  const [promoSent, setPromoSent] = useState("");
  const [phase, setPhase] = useState<CheckoutPhase>("form");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step, phase]);

  const zone = zones.find((z) => z.counties.includes(form.county));
  const { quote, request, updating, unavailable } = useCartQuote({ lines, method, county: form.county || undefined, promoCode: promoSent || undefined, phone: account?.phone });
  const delivery = method === "pickup" ? 0 : (quote?.deliveryFee ?? zone?.fee ?? 0);
  const total = quote?.total ?? 0;
  const codAllowed = quote?.codAllowed ?? method === "pickup";
  const promoValid = !!quote?.promo?.valid;
  const stockProblems = quote?.warnings ?? [];
  const blocked = !quote || unavailable.length > 0 || stockProblems.length > 0 || (method === "delivery" && quote.deliveryPending);
  const set = (k: keyof ContactForm) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const options = PAY_OPTIONS.filter((o) => paymentMethods.includes(o.id));
  useEffect(() => {
    // Keep the selection on an enabled method (settings may change, or COD may not apply to this order).
    const usable = options.filter((o) => o.id !== "cod" || codAllowed);
    if (usable.length && !usable.some((o) => o.id === pay)) setPay(usable[0].id);
  }, [codAllowed, pay, paymentMethods]); // eslint-disable-line react-hooks/exhaustive-deps

  const choosePlace = (id: string) => {
    setPlaceId(id);
    const a = saved.find((x) => x.id === id);
    if (!a) {
      setForm((f) => ({ ...f, county: "", area: "", street: "" }));
      return;
    }
    // The place decides the destination (and so the delivery fee); a recipient and phone override the account's.
    setForm((f) => ({ ...f, county: a.county, area: a.area, street: a.street, name: a.recipient || account?.name || f.name, phone: a.phone || account?.phone || f.phone }));
  };

  useEffect(() => {
    // Start on the default place once they load; if the chosen one was removed, fall back.
    if (!saved.length) {
      if (placeId && placeId !== NEW_ADDRESS) setPlaceId(null);
      return;
    }
    if (placeId === NEW_ADDRESS || (placeId && saved.some((a) => a.id === placeId))) return;
    choosePlace((saved.find((a) => a.isDefault) ?? saved[0]).id);
  }, [saved]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!payPhone && form.phone) setPayPhone(form.phone);
  }, [form.phone, payPhone]);

  if (lines.length === 0 && phase === "form") {
    return (
      <div className="mx-auto max-w-xl px-4 py-32 text-center">
        <h1 className="display text-5xl">Your bag is empty</h1>
        <p className="mt-3 text-muted">Add something to your bag to check out.</p>
        <Link to={ROUTES.shop} className="btn-dark mt-8">
          Browse the shop
        </Link>
      </div>
    );
  }

  const typingNew = method === "delivery" && (!saved.length || placeId === NEW_ADDRESS || placeId === null);

  const validateStep1 = (): boolean => {
    const e = validateContact(form, method);
    if (typingNew && savePlace && !placeLabel.trim()) e.saveLabel = "Give this address a name, like Home.";
    setErrors(e);
    return isValid(e);
  };

  /** Keeps a newly typed address for next time. Failing to save never blocks the order. */
  const rememberPlace = async () => {
    if (!typingNew || !savePlace) return;
    try {
      const a = await createAddress({ label: placeLabel.trim(), county: form.county, area: form.area.trim(), street: form.street.trim() }).unwrap();
      setPlaceId(a.id);
      setSavePlace(false);
    } catch {
      /* the order can still go ahead */
    }
  };

  const validateStep2 = (): boolean => {
    const e = validatePayment(pay, payPhone, card);
    setErrors(e);
    return isValid(e);
  };

  const next = () => {
    if (step === 1 && validateStep1()) {
      void rememberPlace();
      setStep(2);
    }
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const applyPromo = () => setPromoSent(promoInput.trim().toUpperCase());

  /** One key per distinct order, so a retry of the same checkout returns the order already placed. */
  const keyFor = (sig: string): string => {
    if (placed.current?.sig !== sig) placed.current = { sig, key: crypto.randomUUID() };
    return placed.current.key;
  };

  const goToOrder = (order: Order) => {
    setLastOrder(order);
    clear();
    navigate(orderPath(order.id));
  };

  /** Asks the server whether the mobile-money payment has gone through; moves on when it has, fails, or time runs out. */
  const watchPayment = (order: Order, until: number) => {
    timer.current = setTimeout(async () => {
      const r = await fetchStatus({ number: order.id, phone: order.phone }).unwrap().catch(() => null);
      if (r && r.paymentStatus !== "pending") return goToOrder({ ...order, paymentStatus: r.paymentStatus });
      if (Date.now() > until) return goToOrder(order);
      watchPayment(order, until);
    }, PAYMENT_POLL_MS);
  };

  const placeOrder = async () => {
    if (blocked) return;
    setSubmitError("");
    setPhase("placing");
    const mobile = pay === "mpesa" || pay === "airtel";
    const input: Omit<PlaceOrderInput, "idempotencyKey"> = {
      lines: request.lines,
      method,
      paymentMethod: pay,
      ...(method === "delivery" && { county: form.county, address: `${form.street.trim()}, ${form.area.trim()}` }),
      ...(promoValid && { promoCode: promoSent }),
      ...(form.notes.trim() && { notes: form.notes.trim().slice(0, 500) }),
      contactName: form.name.trim(),
      contactPhone: normalizePhone(form.phone) ?? form.phone,
      ...(mobile && { payerPhone: normalizePhone(payPhone) ?? payPhone }),
    };
    try {
      const res = await placeOrderCall({ ...input, idempotencyKey: keyFor(JSON.stringify(input)) }).unwrap();
      if (mobile && res.order.paymentStatus === "pending") {
        setLastOrder(res.order);
        clear();
        setPhase("pending");
        watchPayment(res.order, Date.now() + MOBILE_PAYMENT_WAIT_MS);
      } else goToOrder(res.order);
    } catch (err) {
      const code = (err as { data?: { code?: string } }).data?.code;
      if (code === "idempotency_key_conflict") placed.current = undefined;
      if (code === "invalid_promo") setPromoSent("");
      setSubmitError(errorMessage(err));
      setPhase("form");
    }
  };

  const steps = CHECKOUT_STEPS;

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-10 pt-8 md:px-8 md:pt-12">
      <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowLeft size={16} /> Continue shopping
      </Link>
      <h1 className="mt-4 display text-5xl">Checkout</h1>

      <StepIndicator step={step} steps={steps} />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div>
          <AnimatePresence mode="wait">
            {phase === "pending" ? (
              <PendingPayment
                key="pending"
                total={total}
                phone={normalizePhone(payPhone)}
                method={pay}
                onSkip={() => {
                  clearTimeout(timer.current);
                  const order = useCart.getState().lastOrder;
                  if (order) navigate(orderPath(order.id));
                }}
              />
            ) : (
              <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
                {step === 1 && (
                  <DeliveryStep method={method} onMethod={setMethod} form={form} onField={set}
                    errors={errors}
                    zone={zone}
                    delivery={delivery}
                    places={{
                      saved,
                      selected: placeId ?? NEW_ADDRESS,
                      onSelect: choosePlace,
                      onDelete: (id) => void deleteAddress(id),
                      busy: deleting,
                      save: savePlace,
                      onSave: setSavePlace,
                      saveLabel: placeLabel,
                      onSaveLabel: setPlaceLabel,
                    }}
                  />
                )}
                {step === 2 && (
                  <PaymentStep options={options} pay={pay} onPay={setPay} codAllowed={codAllowed} payPhone={payPhone} onPayPhone={setPayPhone} card={card} onCard={setCard} errors={errors} total={total} />
                )}
                {step === 3 && <ReviewStep form={form} method={method} eta={quote?.delivery?.eta} pay={pay} payPhone={payPhone} onEdit={setStep} onField={set} />}

                {(stockProblems.length > 0 || unavailable.length > 0 || submitError) && (
                  <div role="alert" className="mt-6 space-y-1 rounded-xl bg-danger/10 p-4 text-sm text-danger">
                    {stockProblems.map((w) => (
                      <p key={w.variantId}>{w.message}</p>
                    ))}
                    {unavailable.map((l) => (
                      <p key={l.key}>
                        {l.snapshot.name} ({l.color}, {l.size}) is no longer available.
                      </p>
                    ))}
                    {(stockProblems.length > 0 || unavailable.length > 0) && <p>Update your bag to continue.</p>}
                    {submitError && <p>{submitError}</p>}
                  </div>
                )}

                <div className="mt-10 flex items-center justify-between gap-3">
                  {step > 1 ? (
                    <button className="btn-ghost" onClick={() => setStep((s) => (s - 1) as CheckoutStep)}>
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
                    <button className="btn-accent h-14 px-10 text-base disabled:opacity-60" onClick={placeOrder} disabled={blocked || phase === "placing"}>
                      {phase === "placing" ? "Placing order..." : pay === "cod" ? "Place order" : `Pay ${formatKES(total)}`}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="lg:sticky lg:top-32 lg:self-start">
          {phase !== "pending" && (
            <OrderSummary
              lines={lines}
              quote={quote}
              updating={updating}
              giftFee={giftFee}
              method={method}
              hasZone={!!zone}
              promoInput={promoInput}
              promoSent={promoSent}
              onPromoInput={setPromoInput}
              onApplyPromo={applyPromo}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

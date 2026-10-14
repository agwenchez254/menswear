import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft } from "@phosphor-icons/react";
import type { DeliveryMethod } from "@/models";
import type { CardForm, CheckoutPhase, CheckoutStep, ContactForm, FormErrors, PaymentMethod } from "@/features/checkout/models";
import { useCart } from "@/store/cart";
import { zoneFor } from "@/data/delivery";
import { PROMO } from "@/config/commerce";
import { orderPath, ROUTES } from "@/config/routes";
import { formatKES } from "@/lib/format";
import { normalizePhone } from "@/lib/phone";
import { cartSubtotal, deliveryFee, isCodAllowed, orderTotal, promoDiscount } from "@/services/pricing";
import { createOrder } from "@/services/order";
import { CHECKOUT_STEPS, EMPTY_CONTACT, MOBILE_PAYMENT_WAIT_MS, PAY_OPTIONS } from "@/features/checkout/constants";
import { isValid, validateContact, validatePayment } from "@/features/checkout/validation";
import { OrderSummary } from "@/features/checkout/components/OrderSummary";
import { StepIndicator } from "@/features/checkout/components/StepIndicator";
import { PendingPayment } from "@/features/checkout/components/PendingPayment";
import { DeliveryStep } from "@/features/checkout/components/DeliveryStep";
import { PaymentStep } from "@/features/checkout/components/PaymentStep";
import { ReviewStep } from "@/features/checkout/components/ReviewStep";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { lines, clear, setLastOrder } = useCart();
  const [step, setStep] = useState<CheckoutStep>(1);
  const [method, setMethod] = useState<DeliveryMethod>("delivery");
  const [form, setForm] = useState<ContactForm>(EMPTY_CONTACT);
  const [pay, setPay] = useState<PaymentMethod>("mpesa");
  const [payPhone, setPayPhone] = useState("");
  const [card, setCard] = useState<CardForm>({ number: "", exp: "", cvc: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState(false);
  const [promoErr, setPromoErr] = useState("");
  const [phase, setPhase] = useState<CheckoutPhase>("form");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step, phase]);

  const subtotal = cartSubtotal(lines);
  const zone = zoneFor(form.county);
  const discount = promoDiscount(subtotal, promo);
  const delivery = deliveryFee(method, zone, subtotal);
  const total = orderTotal(subtotal, discount, delivery);
  const codAllowed = isCodAllowed(method, zone);
  const set = (k: keyof ContactForm) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

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
        <Link to={ROUTES.shop} className="btn-dark mt-8">
          Browse the shop
        </Link>
      </div>
    );
  }

  const validateStep1 = (): boolean => {
    const e = validateContact(form, method);
    setErrors(e);
    return isValid(e);
  };

  const validateStep2 = (): boolean => {
    const e = validatePayment(pay, payPhone, card);
    setErrors(e);
    return isValid(e);
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
      timer.current = setTimeout(() => finish(), MOBILE_PAYMENT_WAIT_MS);
    } else finish();
  };

  const finish = () => {
    const order = createOrder({
      lines,
      subtotal,
      delivery,
      discount,
      total,
      deliveryMethod: method,
      area: form.area,
      county: form.county,
      street: form.street,
      paymentLabel: PAY_OPTIONS.find((o) => o.id === pay)!.label,
      name: form.name,
      phone: form.phone,
      zoneEta: zone?.eta,
    });
    setLastOrder(order);
    clear();
    navigate(orderPath(order.id));
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
                onCancel={() => {
                  clearTimeout(timer.current);
                  setPhase("form");
                }}
              />
            ) : (
              <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
                {step === 1 && (
                  <DeliveryStep method={method} onMethod={setMethod} form={form} onField={set} errors={errors} zone={zone} delivery={delivery} />
                )}
                {step === 2 && (
                  <PaymentStep pay={pay} onPay={setPay} codAllowed={codAllowed} payPhone={payPhone} onPayPhone={setPayPhone} card={card} onCard={setCard} errors={errors} total={total} />
                )}
                {step === 3 && <ReviewStep form={form} method={method} zone={zone} pay={pay} payPhone={payPhone} onEdit={setStep} onField={set} />}

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
                    <button className="btn-accent h-14 px-10 text-base" onClick={placeOrder}>
                      {pay === "cod" ? "Place order" : `Pay ${formatKES(total)}`}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="lg:sticky lg:top-32 lg:self-start">
          <OrderSummary
            lines={lines}
            subtotal={subtotal}
            discount={discount}
            delivery={delivery}
            total={total}
            method={method}
            hasZone={!!zone}
            promoInput={promoInput}
            promoError={promoErr}
            promoApplied={promo}
            onPromoInput={setPromoInput}
            onApplyPromo={applyPromo}
          />
        </aside>
      </div>
    </div>
  );
}

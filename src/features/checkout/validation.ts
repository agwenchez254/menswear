import type { DeliveryMethod } from "@/models";
import type { CardForm, ContactForm, FormErrors, PaymentMethod } from "@/features/checkout/models";
import { normalizePhone } from "@/lib/phone";

/** Step 1: who and where. Delivery-only fields are skipped for studio pickup. */
export const validateContact = (form: ContactForm, method: DeliveryMethod): FormErrors => {
  const e: FormErrors = {};
  if (form.name.trim().length < 3) e.name = "Enter your full name.";
  if (!normalizePhone(form.phone)) e.phone = "Enter a valid Kenyan number, like 0712 345 678.";
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "That email does not look right.";
  if (method === "delivery") {
    if (!form.county) e.county = "Choose your county.";
    if (form.area.trim().length < 2) e.area = "Enter your town or estate.";
    if (form.street.trim().length < 3) e.street = "Add a street, building or landmark so the rider can find you.";
  }
  return e;
};

/** Step 2: how to pay. */
export const validatePayment = (pay: PaymentMethod, payPhone: string, card: CardForm): FormErrors => {
  const e: FormErrors = {};
  if ((pay === "mpesa" || pay === "airtel") && !normalizePhone(payPhone)) {
    e.payPhone = `Enter the ${pay === "mpesa" ? "Safaricom" : "Airtel"} number to charge.`;
  }
  if (pay === "card") {
    if (card.number.replace(/\s/g, "").length < 15) e.cardNumber = "Enter the 16-digit card number.";
    if (!/^\d{2}\/\d{2}$/.test(card.exp)) e.cardExp = "Use MM/YY.";
    if (card.cvc.length < 3) e.cardCvc = "3 digits.";
  }
  return e;
};

export const isValid = (errors: FormErrors): boolean => Object.keys(errors).length === 0;

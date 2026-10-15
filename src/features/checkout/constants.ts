import { Bank, CreditCard, DeviceMobile, HandCoins } from "@phosphor-icons/react";
import type { ContactForm, PayOption } from "@/features/checkout/models";

export const CHECKOUT_STEPS = ["Delivery", "Payment", "Review"] as const;

/** How long to wait for the customer to approve the phone prompt before moving on to the order page. */
export const MOBILE_PAYMENT_WAIT_MS = 90_000;

/** How often to ask the server whether the payment has gone through. */
export const PAYMENT_POLL_MS = 3000;

export const EMPTY_CONTACT: ContactForm = { name: "", phone: "", email: "", county: "", area: "", street: "", notes: "" };

export const PAY_OPTIONS: PayOption[] = [
  { id: "mpesa", label: "M-Pesa", hint: "STK push to your phone. Enter your PIN to pay.", icon: DeviceMobile },
  { id: "airtel", label: "Airtel Money", hint: "Approve the prompt on your Airtel line.", icon: Bank },
  { id: "card", label: "Card", hint: "Visa or Mastercard.", icon: CreditCard },
  { id: "cod", label: "Pay on delivery", hint: "Cash or M-Pesa to the rider, where offered.", icon: HandCoins },
];

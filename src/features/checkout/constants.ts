import { Bank, CreditCard, DeviceMobile, HandCoins } from "@phosphor-icons/react";
import type { ContactForm, PayOption } from "@/features/checkout/models";

export const CHECKOUT_STEPS = ["Delivery", "Payment", "Review"] as const;

/** How long the simulated STK push waits before succeeding. Replace with polling your payments API. */
export const MOBILE_PAYMENT_WAIT_MS = 6000;

export const EMPTY_CONTACT: ContactForm = { name: "", phone: "", email: "", county: "", area: "", street: "", notes: "" };

export const PAY_OPTIONS: PayOption[] = [
  { id: "mpesa", label: "M-Pesa", hint: "STK push to your phone. Enter your PIN to pay.", icon: DeviceMobile },
  { id: "airtel", label: "Airtel Money", hint: "Approve the prompt on your Airtel line.", icon: Bank },
  { id: "card", label: "Card", hint: "Visa or Mastercard.", icon: CreditCard },
  { id: "cod", label: "Pay on delivery", hint: "Nairobi only. Cash or M-Pesa to the rider.", icon: HandCoins },
];

import type { Icon } from "@phosphor-icons/react";
import type { CartLine, DeliveryMethod, Zone } from "@/models";

export type CheckoutStep = 1 | 2 | 3;

export type PaymentMethod = "mpesa" | "airtel" | "card" | "cod";

/** "pending" is the wait for the phone prompt; "failed" is reserved for gateway errors. */
export type CheckoutPhase = "form" | "pending" | "failed";

export interface ContactForm {
  name: string;
  phone: string;
  email: string;
  county: string;
  area: string;
  street: string;
  notes: string;
}

export interface CardForm {
  number: string;
  exp: string;
  cvc: string;
}

/** Field name to message. Empty means valid. */
export type FormErrors = Record<string, string>;

export interface PayOption {
  id: PaymentMethod;
  label: string;
  hint: string;
  icon: Icon;
}

export interface StepIndicatorProps {
  step: CheckoutStep;
  steps: readonly string[];
}

export interface PendingPaymentProps {
  total: number;
  /** Normalised +254 number the prompt was sent to. */
  phone: string | null;
  method: PaymentMethod;
  onCancel: () => void;
}

export interface OrderSummaryProps {
  lines: CartLine[];
  subtotal: number;
  discount: number;
  delivery: number;
  total: number;
  method: DeliveryMethod;
  /** Whether a destination county has been chosen yet. */
  hasZone: boolean;
  promoInput: string;
  promoError: string;
  promoApplied: boolean;
  onPromoInput: (value: string) => void;
  onApplyPromo: () => void;
}

/** Returns an onChange handler for one field of the contact form. */
export type FieldChangeFactory = (key: keyof ContactForm) => (e: { target: { value: string } }) => void;

export interface DeliveryStepProps {
  method: DeliveryMethod;
  onMethod: (method: DeliveryMethod) => void;
  form: ContactForm;
  onField: FieldChangeFactory;
  errors: FormErrors;
  /** Zone for the chosen county, when known. */
  zone?: Zone;
  delivery: number;
}

export interface PaymentStepProps {
  pay: PaymentMethod;
  onPay: (method: PaymentMethod) => void;
  codAllowed: boolean;
  payPhone: string;
  onPayPhone: (value: string) => void;
  card: CardForm;
  onCard: (card: CardForm) => void;
  errors: FormErrors;
  total: number;
}

export interface ReviewStepProps {
  form: ContactForm;
  method: DeliveryMethod;
  zone?: Zone;
  pay: PaymentMethod;
  payPhone: string;
  onEdit: (step: CheckoutStep) => void;
  onField: FieldChangeFactory;
}

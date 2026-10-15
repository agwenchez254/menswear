import type { Quote } from "@/api/quote";
import type { SavedAddress } from "@/api/addresses";
import type { Icon } from "@phosphor-icons/react";
import type { CartLine, DeliveryMethod, Zone } from "@/models";

export type CheckoutStep = 1 | 2 | 3;

export type PaymentMethod = "mpesa" | "airtel" | "card" | "cod";

/** "placing" is the order being sent; "pending" is the wait for the phone prompt. */
export type CheckoutPhase = "form" | "placing" | "pending";

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
  /** Leave the wait and go to the order page, where payment status keeps updating. */
  onSkip: () => void;
}

export interface OrderSummaryProps {
  lines: CartLine[];
  /** The server price; undefined until it first answers. */
  quote?: Quote;
  /** True while a changed bag or destination is being re-priced. */
  updating: boolean;
  giftFee: number;
  method: DeliveryMethod;
  /** Whether a destination county has been chosen yet. */
  hasZone: boolean;
  promoInput: string;
  /** The code that was sent to the server, if any. */
  promoSent: string;
  onPromoInput: (value: string) => void;
  onApplyPromo: () => void;
}

/** Returns an onChange handler for one field of the contact form. */
export type FieldChangeFactory = (key: keyof ContactForm) => (e: { target: { value: string } }) => void;

/** Saved delivery places and the choice for this order. */
export interface PlacesProps {
  saved: SavedAddress[];
  /** A saved place's id, or "new" for typing a different address. */
  selected: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  busy?: boolean;
  /** Keep the typed address for next time. */
  save: boolean;
  onSave: (v: boolean) => void;
  saveLabel: string;
  onSaveLabel: (v: string) => void;
}

export interface DeliveryStepProps {
  method: DeliveryMethod;
  onMethod: (method: DeliveryMethod) => void;
  form: ContactForm;
  onField: FieldChangeFactory;
  errors: FormErrors;
  /** Zone for the chosen county, when known. */
  zone?: Zone;
  delivery: number;
  places: PlacesProps;
}

export interface PaymentStepProps {
  options: PayOption[];
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
  /** Delivery estimate from the server quote. */
  eta?: string;
  pay: PaymentMethod;
  payPhone: string;
  onEdit: (step: CheckoutStep) => void;
  onField: FieldChangeFactory;
}

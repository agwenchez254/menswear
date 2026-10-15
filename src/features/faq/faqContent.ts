import type { FaqItem } from "./faqLogic.ts";

export interface FaqContext {
  /** Where studio pickup orders are collected. */
  pickupAddress: string;
  /** Payment methods the store currently offers, as customers read them (M-Pesa, Airtel Money...). */
  paymentLabels: string[];
  /** KES per gift-wrapped unit, as text, for example "KES 350". */
  giftFee: string;
  whatsapp: string;
}

export const FAQ_CATEGORIES = [
  { id: "orders", label: "Orders" },
  { id: "delivery", label: "Delivery and returns" },
  { id: "payment", label: "Payment" },
  { id: "account", label: "Account and receipts" },
] as const;

const list = (labels: string[]): string => {
  if (labels.length <= 1) return labels.join("");
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
};

/** The questions, written for how this store works. Values that change in the dashboard come in through the context. */
export function buildFaqs(c: FaqContext): FaqItem[] {
  return [
    {
      id: "how-to-order",
      category: "orders",
      question: "How do I place an order?",
      answer:
        "Add what you like to your bag, open it and choose Checkout. Pick delivery or studio pickup, choose how you want to pay and confirm. You will see the final total, with delivery included, before you pay.",
      links: [{ label: "Start shopping", to: "/shop" }],
    },
    {
      id: "need-an-account",
      category: "orders",
      question: "Do I need an account to order?",
      answer:
        "Yes. Checkout asks you to sign in or create an account with your email and a password. We email you a six-digit code once to confirm the address. Having an account keeps your orders, receipts and tracking in one place.",
    },
    {
      id: "gift-orders",
      category: "orders",
      question: "Can I send an order as a gift?",
      answer: `Yes. Gift items can be wrapped with a card for the recipient, and each gift-wrapped item adds ${c.giftFee}. At checkout you can also give a different name and phone number, so the order goes straight to them.`,
      links: [{ label: "Send a gift", to: "/gift" }],
    },
    {
      id: "change-or-cancel",
      category: "orders",
      question: "Can I change or cancel an order?",
      answer: `Message us on WhatsApp (${c.whatsapp}) with your order number as soon as you can. We can cancel an order until it ships, and we can often fix a size or address while it is still being packed.`,
    },
    {
      id: "delivery-cost-and-time",
      category: "delivery",
      question: "How much is delivery and how long does it take?",
      answer:
        "Both depend on your county. Pick your county at checkout and the delivery fee and the estimated arrival show up before you pay. Some areas get free delivery above a set order amount, and the delivery section on the home page lists every zone.",
    },
    {
      id: "studio-pickup",
      category: "delivery",
      question: "Can I collect my order myself?",
      answer: `Yes, and it is free. Choose Studio pickup at checkout and collect from ${c.pickupAddress}. Bring your order number.`,
    },
    {
      id: "track-order",
      category: "delivery",
      question: "How do I track my order?",
      answer:
        "Open the Orders tab in your account to see every order with its status and timeline. You can also use Track an order with your order number and the phone number on the order.",
      links: [
        { label: "Track an order", to: "/track" },
        { label: "Your orders", to: "/account?tab=orders" },
      ],
    },
    {
      id: "payment-methods",
      category: "payment",
      question: "Which payment methods do you accept?",
      answer: `You can pay with ${list(c.paymentLabels)}. Checkout only shows the options that are available for your order.`,
    },
    {
      id: "how-mpesa-works",
      category: "payment",
      question: "How does M-Pesa payment work?",
      answer:
        "Choose M-Pesa and enter the number you want to pay from. We send a payment prompt to that phone, and you approve it with your M-Pesa PIN. The order page updates by itself once the payment arrives. If the prompt does not appear, you can send it again from the order page, to the same number or another one.",
      links: [{ label: "Paying with M-Pesa", to: "/help/paying-with-mpesa" }],
    },
    {
      id: "pay-on-delivery",
      category: "payment",
      question: "Can I pay when my order arrives?",
      answer:
        "In selected delivery areas, and for studio pickup, yes. Checkout shows Pay on delivery only when it is available for your order. Your order is marked as paid once it is delivered.",
    },
    {
      id: "returns-and-exchanges",
      category: "delivery",
      question: "Can I return or exchange something?",
      answer: `Message us on WhatsApp (${c.whatsapp}) with your order number and tell us what is wrong. We will explain the options for that order. Our delivery and returns page covers the details.`,
      links: [
        { label: "Delivery and returns", to: "/help/delivery-and-returns" },
        { label: "Size guide", to: "/help/size-guide" },
      ],
    },
    {
      id: "vat",
      category: "account",
      question: "Do your prices include VAT?",
      answer:
        "Prices are in Kenya Shillings and are the price you pay. When VAT applies to your order it is already inside that price, and your receipt shows how much of the total it is. Nothing is added at the end.",
    },
    {
      id: "receipts",
      category: "account",
      question: "Where do I find my receipt?",
      answer:
        "Open your account, go to Orders, choose the order and press Print receipt. In the print window you can also save it as a PDF. The receipt is for your records and is not a KRA eTIMS tax invoice.",
      links: [{ label: "Your orders", to: "/account?tab=orders" }],
    },
    {
      id: "no-code",
      category: "account",
      question: "My verification code did not arrive. What now?",
      answer:
        "Check your spam folder first, then wait a minute and ask for a new code from the sign-up screen. A new code replaces the old one, so use the latest email. After too many wrong tries a code stops working, and a fresh one fixes that.",
    },
  ];
}

/** The questions the home page shows before the link to the full list. */
export const HOME_FAQ_IDS = ["how-to-order", "delivery-cost-and-time", "how-mpesa-works", "pay-on-delivery", "returns-and-exchanges", "receipts"] as const;

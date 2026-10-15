import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { CheckCircle, Clock, Gift, MapPin, Receipt, WarningCircle, WhatsappLogo } from "@phosphor-icons/react";
import { errorMessage } from "@/api/baseApi";
import { useGetOrderStatusQuery, useResendPromptMutation } from "@/api/orders";
import { useSiteSettings } from "@/api/settings";
import { accountOrderPath } from "@/config/routes";
import { useCart } from "@/store/cart";
import { formatKES } from "@/lib/format";
import { normalizePhone } from "@/lib/phone";
import type { PaymentStatus } from "@/models";

const POLL_MS = 5000;

/** What the customer owes, from the payment status the server reports. */
function paymentNote(method: string, status: PaymentStatus): string {
  if (status === "paid") return "Paid";
  if (status === "refunded") return "Refunded";
  if (method === "cod") return "To pay on delivery";
  return status === "failed" ? "Payment was not completed" : "Waiting for payment";
}

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const order = useCart((s) => s.lastOrder);
  const { whatsappDigits } = useSiteSettings();
  const mine = !!order && order.id === id;
  // Keep asking the server until the payment settles, so the page updates when the customer approves the prompt.
  const live = useGetOrderStatusQuery({ number: order?.id ?? "", phone: order?.phone ?? "" }, { skip: !mine, pollingInterval: mine && order.paymentMethod !== "cod" ? POLL_MS : 0 });
  const [resend, { isLoading: resending, data: resent, error: resendError }] = useResendPromptMutation();
  const [payPhone, setPayPhone] = useState(order?.payerPhone ?? order?.phone ?? "");
  const [phoneError, setPhoneError] = useState("");

  if (!order || !mine) {
    return (
      <div className="mx-auto max-w-xl px-4 py-32 text-center">
        <h1 className="display text-5xl">Order not found</h1>
        <p className="mt-3 text-muted">We could not find an order with that number on this device.</p>
        <Link to="/shop" className="btn-dark mt-8">
          Back to the shop
        </Link>
      </div>
    );
  }

  const status: PaymentStatus = live.data?.paymentStatus ?? order.paymentStatus;
  const settled = status === "paid" || status === "refunded";
  const needsPayment = order.paymentMethod !== "cod" && !settled;
  const hasGift = order.lines.some((l) => l.giftTo !== undefined);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-14 md:pt-20">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className={`grid size-20 place-items-center text-paper ${needsPayment ? "bg-ink" : "bg-mpesa"}`}
      >
        {needsPayment ? <Clock size={44} weight="fill" /> : <CheckCircle size={44} weight="fill" />}
      </motion.div>
      <h1 className="mt-6 display text-5xl md:text-6xl">
        {needsPayment ? `Thanks, ${order.name.split(" ")[0]}. We are waiting for your payment.` : `Asante, ${order.name.split(" ")[0]}. Your order is in.`}
      </h1>
      <p className="mt-4 text-muted">
        Order <strong className="text-ink">{order.id}</strong>. A receipt is on its way to your email.{" "}
        <Link to={accountOrderPath(order.id)} className="underline underline-offset-4">
          View it in your account
        </Link>
        .
      </p>

      {needsPayment && (
        <div role="status" className="mt-6 rounded-2xl bg-accent/30 p-5 text-sm">
          <p className="flex items-center gap-2 font-medium">
            {status === "failed" ? <WarningCircle size={18} /> : <Clock size={18} />}
            {status === "failed" ? "The payment did not go through." : "Your payment has not been confirmed yet."}
          </p>
          <p className="mt-1 text-muted">We hold your items for a short while. This page updates by itself once the payment arrives.</p>
          {order.paymentMethod === "mpesa" && (
            <div className="mt-3">
              <label htmlFor="resend-phone" className="label">
                M-Pesa number to charge
              </label>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <input id="resend-phone" type="tel" inputMode="tel" className="field h-11 min-h-11 max-w-56" value={payPhone} onChange={(e) => setPayPhone(e.target.value)} />
                <button
                  className="btn-dark h-11 min-h-11 px-5 disabled:opacity-60"
                  disabled={resending}
                  onClick={() => {
                    const p = normalizePhone(payPhone);
                    if (!p) return setPhoneError("Enter a valid Kenyan number, like 0712 345 678.");
                    setPhoneError("");
                    void resend({ number: order.id, payerPhone: p });
                  }}
                >
                  {resending ? "Sending..." : "Send the M-Pesa prompt again"}
                </button>
              </div>
              {phoneError && <p className="mt-1 text-danger">{phoneError}</p>}
              {resent && !resendError && <p className="mt-1 text-muted">Prompt sent to {resent.payerPhone}. Check that phone.</p>}
              {resendError && <p className="mt-1 text-danger">{errorMessage(resendError)}</p>}
            </div>
          )}
        </div>
      )}

      <div className="mt-10 grid gap-px overflow-hidden rounded-3xl bg-line ring-1 ring-ink/15 sm:grid-cols-2">
        <div className="bg-surface p-6">
          <p className="flex items-center gap-2 text-sm text-muted">
            <MapPin size={18} /> {order.method}
          </p>
          <p className="mt-2 font-medium">{order.address}</p>
          <p className="mt-1 text-sm text-muted">{order.eta}</p>
          {(order.contactName || order.contactPhone) && <p className="mt-2 text-sm text-muted">Contact: {[order.contactName, order.contactPhone].filter(Boolean).join(", ")}</p>}
        </div>
        <div className="bg-surface p-6">
          <p className="flex items-center gap-2 text-sm text-muted">
            <Receipt size={18} /> {order.payment}
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{formatKES(order.total)}</p>
          <p className="mt-1 text-sm text-muted">{paymentNote(order.paymentMethod, status)}</p>
          {order.payerPhone && order.paymentMethod !== "cod" && <p className="mt-1 text-sm text-muted">From {order.payerPhone}</p>}
        </div>
      </div>

      <ul className="mt-8 divide-y divide-line border-y border-line">
        {order.lines.map((l) => (
          <li key={l.key} className="flex items-center justify-between gap-4 py-4 text-sm">
            <div>
              <p className="font-medium">
                {l.name} <span className="text-muted">x {l.qty}</span>
              </p>
              <p className="text-muted">
                {l.colour} · {l.size}
              </p>
              {l.giftTo !== undefined && (
                <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-ink">
                  <Gift size={14} /> Gift{l.giftTo ? ` for ${l.giftTo}` : ""}
                </p>
              )}
            </div>
            <p className="tabular-nums">{formatKES(l.lineTotal)}</p>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-1 text-sm tabular-nums">
        <div className="flex justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd>{formatKES(order.subtotal)}</dd>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-mpesa">
            <dt>Discount</dt>
            <dd>-{formatKES(order.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted">Delivery</dt>
          <dd>{order.delivery === 0 ? "Free" : formatKES(order.delivery)}</dd>
        </div>
      </dl>
      {hasGift && <p className="mt-4 text-sm text-muted">Your gift ships boxed and tied, with the card you wrote and no prices on the slip.</p>}

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to={`/track/${encodeURIComponent(order.id)}`} className="btn-dark">
          Track this order
        </Link>
        <Link to="/shop" className="btn-ghost">
          Keep shopping
        </Link>
        <a
          className="btn-ghost"
          href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(`Hi Jabali, I would like an update on order ${order.id}.`)}`}
          target="_blank"
          rel="noreferrer"
        >
          <WhatsappLogo size={18} weight="fill" /> Track on WhatsApp
        </a>
      </div>
    </div>
  );
}

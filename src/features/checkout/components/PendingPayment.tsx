import { motion } from "motion/react";
import { DeviceMobile } from "@phosphor-icons/react";
import type { PendingPaymentProps } from "@/features/checkout/models";
import { MOBILE_PAYMENT_WAIT_MS } from "@/features/checkout/constants";
import { formatKES } from "@/lib/format";

/** Shown while we wait for the customer to approve the mobile-money prompt on their phone. */
export function PendingPayment({ total, phone, method, onSkip }: PendingPaymentProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-3xl bg-surface p-8 text-center ring-1 ring-ink/15 md:p-12" role="status" aria-live="polite">
      <div className="relative mx-auto grid size-24 place-items-center">
        <motion.span className="absolute inset-0 rounded-full bg-mpesa/20" animate={{ scale: [1, 1.5], opacity: [0.6, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />
        <span className="relative grid size-20 place-items-center rounded-full bg-mpesa text-paper">
          <DeviceMobile size={36} />
        </span>
      </div>
      <h2 className="mt-6 display text-4xl">Check your phone</h2>
      <p className="mx-auto mt-3 max-w-[40ch] text-muted">
        We sent a payment request for <strong className="text-ink">{formatKES(total)}</strong> to <strong className="text-ink">{phone}</strong>. Enter your {method === "mpesa" ? "M-Pesa" : "Airtel Money"} PIN to complete.
      </p>
      <div className="mx-auto mt-6 h-1.5 w-56 overflow-hidden bg-ink/10">
        <motion.div className="h-full bg-mpesa" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: MOBILE_PAYMENT_WAIT_MS / 1000, ease: "linear" }} />
      </div>
      <button className="mt-8 text-sm text-muted underline underline-offset-4 hover:text-ink" onClick={onSkip}>
        Taking long? Go to my order
      </button>
    </motion.div>
  );
}

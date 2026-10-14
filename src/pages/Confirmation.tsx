import { Link, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { CheckCircle, Gift, MapPin, Receipt, WhatsappLogo } from "@phosphor-icons/react";
import { lineTotal, useCart } from "../store/cart";
import { byId, formatKES } from "../data/products";

export default function Confirmation() {
  const { id } = useParams();
  const order = useCart((s) => s.lastOrder);

  if (!order || order.id !== id) {
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

  const hasGift = order.lines.some((l) => l.gift);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-14 md:pt-20">
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }} className="grid size-20 place-items-center bg-mpesa text-paper">
        <CheckCircle size={44} weight="fill" />
      </motion.div>
      <h1 className="mt-6 display text-5xl md:text-6xl">Asante, {order.name.split(" ")[0]}. Your order is in.</h1>
      <p className="mt-4 text-muted">
        Order <strong className="text-ink">{order.id}</strong>. A receipt is on its way to {order.phone} by SMS.
      </p>

      <div className="mt-10 grid gap-px overflow-hidden rounded-3xl bg-line ring-1 ring-ink/15 sm:grid-cols-2">
        <div className="bg-surface p-6">
          <p className="flex items-center gap-2 text-sm text-muted"><MapPin size={18} /> {order.method}</p>
          <p className="mt-2 font-medium">{order.address}</p>
          <p className="mt-1 text-sm text-muted">{order.eta}</p>
        </div>
        <div className="bg-surface p-6">
          <p className="flex items-center gap-2 text-sm text-muted"><Receipt size={18} /> {order.payment}</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{formatKES(order.total)}</p>
          <p className="mt-1 text-sm text-muted">{order.payment === "Pay on delivery" ? "To pay on delivery" : "Paid"}</p>
        </div>
      </div>

      <ul className="mt-8 divide-y divide-line border-y border-line">
        {order.lines.map((l) => {
          const p = byId(l.productId);
          return (
            <li key={l.key} className="flex items-center justify-between gap-4 py-4 text-sm">
              <div>
                <p className="font-medium">{p?.name} <span className="text-muted">x {l.qty}</span></p>
                <p className="text-muted">{l.color} · {l.size}</p>
                {l.gift && <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-ink"><Gift size={14} /> Gift for {l.gift.to}</p>}
              </div>
              <p className="tabular-nums">{formatKES(lineTotal(l))}</p>
            </li>
          );
        })}
      </ul>
      {hasGift && <p className="mt-4 text-sm text-muted">Your gift ships boxed and tied, with the card you wrote and no prices on the slip.</p>}

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/shop" className="btn-dark">Keep shopping</Link>
        <a className="btn-ghost" href={`https://wa.me/254712480316?text=${encodeURIComponent(`Hi Jabali, I would like an update on order ${order.id}.`)}`} target="_blank" rel="noreferrer">
          <WhatsappLogo size={18} weight="fill" /> Track on WhatsApp
        </a>
      </div>
    </div>
  );
}

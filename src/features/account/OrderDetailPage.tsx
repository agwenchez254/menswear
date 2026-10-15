import { Link, useParams } from "react-router-dom";
import { Printer } from "@phosphor-icons/react";
import { errorMessage, isNotFound } from "@/api/baseApi";
import { useGetMyOrderQuery } from "@/api/orders";
import { formatKES } from "@/lib/format";
import { Receipt } from "./ReceiptSheet";
import { statusLabel } from "./receipt";

const when = (iso: string): string => new Date(iso).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });

export default function OrderDetailPage() {
  const { number = "" } = useParams();
  const { data: order, isLoading, error } = useGetMyOrderQuery(number);

  if (isLoading) return <div className="min-h-[60dvh]" aria-busy="true" />;
  if (!order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-32 text-center">
        <h1 className="display text-5xl">{isNotFound(error) ? "Order not found" : "We could not load this order"}</h1>
        <p className="mt-3 text-muted">{isNotFound(error) ? "This order is not on your account." : errorMessage(error)}</p>
        <Link to="/account?tab=orders" className="btn-dark mt-8">
          Back to your orders
        </Link>
      </div>
    );
  }

  const paymentNote =
    order.paymentStatus === "paid"
      ? "Paid"
      : order.paymentStatus === "refunded"
        ? "Refunded"
        : order.paymentMethod === "cod"
          ? "To pay on delivery"
          : "Waiting for payment";

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-10 md:pt-16">
      <Link to="/account?tab=orders" className="text-sm underline underline-offset-4">
        Back to your orders
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl md:text-5xl">{order.id}</h1>
          <p className="mt-1 text-muted">
            Placed {when(order.placedAt)} · {statusLabel(order.status)}
          </p>
        </div>
        <button className="btn-dark" onClick={() => window.print()}>
          <Printer size={18} /> Print receipt
        </button>
      </div>

      <div className="mt-8 grid gap-px overflow-hidden rounded-3xl bg-line ring-1 ring-ink/15 sm:grid-cols-2">
        <div className="bg-surface p-6 text-sm">
          <p className="text-muted">{order.method}</p>
          <p className="mt-2 font-medium">{order.address}</p>
          <p className="mt-1 text-muted">{order.eta}</p>
          {(order.contactName || order.contactPhone) && <p className="mt-2 text-muted">Contact: {[order.contactName, order.contactPhone].filter(Boolean).join(", ")}</p>}
        </div>
        <div className="bg-surface p-6 text-sm">
          <p className="text-muted">{order.payment}</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{formatKES(order.total)}</p>
          <p className="mt-1 text-muted">{paymentNote}</p>
        </div>
      </div>

      {order.timeline.length > 0 && (
        <ol className="mt-8 space-y-2 border-l border-line pl-4 text-sm">
          {order.timeline.map((t, i) => (
            <li key={`${t.type}-${i}`}>
              <span className="font-medium">{statusLabel(t.type)}</span> <span className="text-muted">{when(t.at)}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-10">
        <Receipt order={order} />
      </div>
    </div>
  );
}

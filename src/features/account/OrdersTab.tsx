import { useState } from "react";
import { Link } from "react-router-dom";
import { useGetMyOrdersQuery } from "@/api/orders";
import { errorMessage } from "@/api/baseApi";
import { formatDate, formatKES } from "@/lib/format";
import { accountOrderPath } from "@/config/routes";
import { statusLabel } from "./receipt";

const PAGE_SIZE = 10;

export function OrdersTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error, refetch } = useGetMyOrdersQuery({ page, limit: PAGE_SIZE });

  if (isLoading) return <div className="min-h-40" aria-busy="true" />;
  if (error || !data) {
    return (
      <div role="alert" className="rounded-2xl bg-accent/30 p-5 text-sm">
        <p>{errorMessage(error)}</p>
        <button className="btn-ghost mt-3" onClick={() => void refetch()}>
          Try again
        </button>
      </div>
    );
  }
  if (data.total === 0) {
    return (
      <div className="py-10 text-center">
        <p className="display text-3xl">No orders yet</p>
        <p className="mt-2 text-muted">When you place an order it will show up here, with its receipt.</p>
        <Link to="/shop" className="btn-dark mt-6">
          Start shopping
        </Link>
      </div>
    );
  }
  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  return (
    <div aria-busy={isFetching}>
      <ul className="divide-y divide-line border-y border-line">
        {data.items.map((o) => (
          <li key={o.number}>
            <Link to={accountOrderPath(o.number)} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-4 hover:bg-ink/5">
              <span>
                <span className="block font-medium">{o.number}</span>
                <span className="block text-sm text-muted">
                  {formatDate(o.placedAt)} · {o.lineCount} {o.lineCount === 1 ? "item" : "items"} · {o.method}
                </span>
              </span>
              <span className="text-right">
                <span className="block font-semibold tabular-nums">{formatKES(o.total)}</span>
                <span className="block text-sm text-muted">
                  {statusLabel(o.status)} · {o.paymentStatus === "paid" ? "Paid" : o.paymentStatus === "refunded" ? "Refunded" : o.payment}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {pages > 1 && (
        <nav className="mt-6 flex items-center justify-between text-sm" aria-label="Orders pages">
          <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Newer
          </button>
          <span className="text-muted">
            Page {page} of {pages}
          </span>
          <button className="btn-ghost" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            Older
          </button>
        </nav>
      )}
    </div>
  );
}

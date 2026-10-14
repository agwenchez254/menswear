import { Link } from "react-router-dom";
import { Gift, Minus, Plus, Trash } from "@phosphor-icons/react";
import type { CartLineItemProps } from "@/models";
import { byId } from "@/data/products";
import { productPath } from "@/config/routes";
import { formatKES } from "@/lib/format";
import { lineTotal } from "@/services/pricing";
import { Photo } from "@/components/ui/Photo";

/** One row in the bag drawer: photo, details, quantity stepper and line total. */
export function CartLineItem({ line, onQty, onRemove, onNavigate }: CartLineItemProps) {
  const p = byId(line.productId);
  if (!p) return null;
  return (
    <li className="flex gap-4 py-5">
      <Link to={productPath(p.id)} onClick={onNavigate} className="relative size-24 shrink-0 overflow-hidden">
        <Photo id={p.images[0]} alt={p.name} w={240} className="h-full w-full" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-between gap-2">
          <p className="font-medium leading-snug">{p.name}</p>
          <button className="-mr-2 -mt-1 grid size-9 place-items-center text-muted hover:bg-ink/5 hover:text-danger" onClick={onRemove} aria-label={`Remove ${p.name}`}>
            <Trash size={18} />
          </button>
        </div>
        <p className="text-sm text-muted">
          {line.color} · Size {line.size}
        </p>
        {line.gift && (
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-ink">
            <Gift size={14} /> Gift wrapped for {line.gift.to || "recipient"}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center border border-line">
            <button className="grid size-9 place-items-center hover:bg-ink/5" onClick={() => onQty(line.qty - 1)} aria-label="Decrease quantity">
              <Minus size={14} />
            </button>
            <span className="w-7 text-center text-sm tabular-nums" aria-live="polite">
              {line.qty}
            </span>
            <button className="grid size-9 place-items-center hover:bg-ink/5" onClick={() => onQty(line.qty + 1)} aria-label="Increase quantity">
              <Plus size={14} />
            </button>
          </div>
          <p className="font-semibold tabular-nums">{formatKES(lineTotal(line))}</p>
        </div>
      </div>
    </li>
  );
}

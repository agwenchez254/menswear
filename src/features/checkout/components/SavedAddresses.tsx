import { MapPin, Plus, Trash } from "@phosphor-icons/react";
import type { SavedAddress } from "@/api/addresses";

export const NEW_ADDRESS = "new";

interface SavedAddressesProps {
  addresses: SavedAddress[];
  /** Id of the chosen saved place, or NEW_ADDRESS for typing a different one. */
  selected: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  busy?: boolean;
}

const card = (on: boolean) => `relative flex items-start gap-3 rounded-2xl border p-4 text-left transition ${on ? "border-ink bg-surface ring-1 ring-ink" : "border-line bg-surface hover:border-ink/40"}`;

/** The customer's saved delivery places: one is chosen for this order, or a new one is entered below. */
export function SavedAddresses({ addresses, selected, onSelect, onDelete, busy }: SavedAddressesProps) {
  return (
    <div>
      <h3 className="label">Deliver to</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Saved delivery places">
        {addresses.map((a) => (
          <div key={a.id} className="relative">
            <button type="button" role="radio" aria-checked={selected === a.id} onClick={() => onSelect(a.id)} className={`${card(selected === a.id)} w-full pr-12`}>
              <MapPin size={22} className="mt-0.5 shrink-0" />
              <span className="min-w-0">
                <span className="flex items-center gap-2 font-medium">
                  {a.label}
                  {a.isDefault && <span className="rounded-full bg-ink/10 px-2 py-0.5 text-xs font-normal">Default</span>}
                </span>
                <span className="block truncate text-sm text-muted">{a.street}</span>
                <span className="block truncate text-sm text-muted">
                  {a.area}, {a.county}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => onDelete(a.id)}
              disabled={busy}
              aria-label={`Remove ${a.label}`}
              className="absolute right-1 top-1 grid size-10 place-items-center text-muted hover:text-danger disabled:opacity-50"
            >
              <Trash size={18} />
            </button>
          </div>
        ))}
        <button type="button" role="radio" aria-checked={selected === NEW_ADDRESS} onClick={() => onSelect(NEW_ADDRESS)} className={card(selected === NEW_ADDRESS)}>
          <Plus size={22} className="mt-0.5 shrink-0" />
          <span>
            <span className="block font-medium">A different address</span>
            <span className="text-sm text-muted">Enter it below</span>
          </span>
        </button>
      </div>
    </div>
  );
}

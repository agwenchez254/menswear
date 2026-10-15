import { Link, useSearchParams } from "react-router-dom";
import { OrdersTab } from "@/features/account/OrdersTab";
import { ProfileTab } from "@/features/account/ProfileTab";
import { parseTab, type AccountTab } from "@/features/account/receipt";
import { useAppSelector } from "@/store/hooks";

const TABS: { id: AccountTab; label: string; hint: string }[] = [
  { id: "profile", label: "Profile", hint: "Your details" },
  { id: "orders", label: "Orders", hint: "History and receipts" },
];

export default function AccountPage() {
  const user = useAppSelector((s) => s.auth.user);
  const [params, setParams] = useSearchParams();
  const tab = parseTab(`?${params.toString()}`);
  if (!user) return null;
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:py-20">
      <h1 className="display text-4xl md:text-5xl">Your account</h1>
      <p className="mt-2 text-muted">{user.name}</p>
      <Link to="/track" className="mt-3 inline-block text-sm underline underline-offset-4 hover:text-ink">
        Track an order
      </Link>
      <div className="mt-8 grid gap-6 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-10">
        {/* A side column on wider screens, a row of tabs on phones. */}
        <div role="tablist" aria-label="Account sections" aria-orientation="vertical" className="flex gap-2 md:flex-col md:gap-1 md:self-start">
          {TABS.map((t) => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              role="tab"
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              className={`flex-1 border-l-2 px-4 py-3 text-left md:flex-none ${tab === t.id ? "border-ink bg-ink/5" : "border-transparent hover:bg-ink/5"}`}
              onClick={() => setParams(t.id === "profile" ? {} : { tab: t.id })}
            >
              <span className="block text-sm font-semibold">{t.label}</span>
              <span className="hidden text-xs text-muted md:block">{t.hint}</span>
            </button>
          ))}
        </div>
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="min-w-0">
          {tab === "orders" ? <OrdersTab /> : <ProfileTab />}
        </div>
      </div>
    </div>
  );
}

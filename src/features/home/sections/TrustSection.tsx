import { HandCoins, Package, Phone, Ruler, type Icon } from "@phosphor-icons/react";
import type { TrustSectionProps } from "@/features/home/models";

const ICONS: Record<string, Icon> = { phone: Phone, package: Package, ruler: Ruler, "hand-coins": HandCoins };

export function TrustSection({ items }: TrustSectionProps) {
  if (items.length === 0) return null;
  return (
    <section className="border-y border-ink/15 bg-surface">
      <ul className="mx-auto grid max-w-[1400px] grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        {items.map((t) => {
          const Glyph = ICONS[t.icon] ?? Package;
          return (
            <li key={t.title}>
              <div className="flex items-start gap-4 px-4 py-5 md:px-8">
                <Glyph size={26} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">{t.title}</p>
                  <p className="text-sm text-muted">{t.text}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

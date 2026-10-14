import { homeConfig } from "@/features/home/config";
import type { HomeSectionProps } from "@/features/home/models";

export function TrustSection({ g }: HomeSectionProps) {
  return (
    <section className="border-y border-ink/15 bg-surface">
      <ul className="mx-auto grid max-w-[1400px] grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        {homeConfig[g].trust.map((t) => (
          <li key={t.title}>
            <div className="flex items-start gap-4 px-4 py-5 md:px-8">
              <t.icon size={26} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">{t.title}</p>
                <p className="text-sm text-muted">{t.text}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

import type { FilterSectionProps } from "@/features/shop/models";

export function FilterSection({ title, children }: FilterSectionProps) {
  return (
    <fieldset className="border-t border-line py-5 first:border-t-0 first:pt-0">
      <legend className="mb-3 text-sm font-semibold uppercase tracking-wider">{title}</legend>
      {children}
    </fieldset>
  );
}

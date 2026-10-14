import type { ProductVariant } from "@/models";

interface Selectable {
  colors: { name: string }[];
  sizes: string[];
  variants: ProductVariant[];
}

const forColour = (variants: ProductVariant[], color: string): ProductVariant[] =>
  variants.filter((v) => v.colourName === null || v.colourName === color);

/** Units available in a colour (variants not tied to a colour count for every colour). */
export const colourStock = (variants: ProductVariant[], color: string): number =>
  forColour(variants, color).reduce((n, v) => n + v.available, 0);

/** True when the size is out of stock in this colour, or not offered in it at all. */
export const sizeSoldOut = (variants: ProductVariant[], color: string, size: string): boolean =>
  forColour(variants, color)
    .filter((v) => v.size === size)
    .every((v) => !v.inStock);

/**
 * Re-checks a visitor's colour and size against fresh product data (an editor may have removed the
 * colour, or an order may have sold the size out). An invalid colour falls back to the first one;
 * an unavailable size is cleared, and a lone available size is selected for them.
 */
export function reconcileSelection(p: Selectable, color: string, size: string): { color: string; size: string } {
  const names = p.colors.map((c) => c.name);
  const nextColor = names.includes(color) ? color : (names[0] ?? "");
  const stillOk = size !== "" && p.sizes.includes(size) && !sizeSoldOut(p.variants, nextColor, size);
  if (stillOk) return { color: nextColor, size };
  const lone = p.sizes.length === 1 && !sizeSoldOut(p.variants, nextColor, p.sizes[0]) ? p.sizes[0] : "";
  return { color: nextColor, size: lone };
}

/** A sensible default size: the third one if it is in stock, otherwise the first that is, otherwise none. */
export function firstAvailableSize(p: Selectable, color: string): string {
  const preferred = p.sizes[Math.min(2, p.sizes.length - 1)];
  if (preferred !== undefined && !sizeSoldOut(p.variants, color, preferred)) return preferred;
  return p.sizes.find((s) => !sizeSoldOut(p.variants, color, s)) ?? "";
}

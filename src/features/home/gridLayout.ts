import type { Gender } from "@/models";

export interface GridPlace {
  /** Tailwind classes placing the tile on the mobile flow and the lg grid. */
  cls: string;
  /** CSS object-position for the tile photo. */
  pos?: string;
}

export interface GridLayout {
  /** Tailwind rows class for the lg grid. */
  rows: string;
  /** DOM order (mobile flow). */
  order: string[];
  /** Placement per category slug, plus "all" for the call-to-action tile. */
  place: Record<string, GridPlace>;
}

const LAYOUTS: Record<Gender, GridLayout> = {
  men: {
    rows: "lg:grid-rows-4",
    order: ["suits", "shirts", "kaunda", "shoes", "trousers", "jackets", "tshirts", "accessories"],
    place: {
      suits: { cls: "col-span-2 row-span-2 lg:col-start-1 lg:row-start-1", pos: "50% 25%" },
      shirts: { cls: "lg:col-start-3 lg:row-start-1", pos: "50% 30%" },
      kaunda: { cls: "lg:col-start-3 lg:row-start-2", pos: "50% 20%" },
      shoes: { cls: "row-span-2 lg:col-start-4 lg:row-start-1", pos: "50% 50%" },
      trousers: { cls: "row-span-2 lg:col-start-3 lg:row-start-3", pos: "50% 70%" },
      jackets: { cls: "col-span-2 lg:col-start-1 lg:row-start-3", pos: "50% 35%" },
      tshirts: { cls: "lg:col-start-4 lg:row-start-3", pos: "50% 25%" },
      accessories: { cls: "lg:col-start-4 lg:row-start-4", pos: "50% 50%" },
      all: { cls: "col-span-2 lg:col-start-1 lg:row-start-4" },
    },
  },
  women: {
    rows: "lg:grid-rows-3",
    order: ["dresses", "tops", "knitwear", "jackets", "trousers", "shoes", "accessories"],
    place: {
      dresses: { cls: "col-span-2 row-span-2 lg:col-start-1 lg:row-start-1", pos: "50% 30%" },
      tops: { cls: "lg:col-start-3 lg:row-start-1", pos: "50% 40%" },
      knitwear: { cls: "lg:col-start-3 lg:row-start-2", pos: "50% 30%" },
      jackets: { cls: "col-span-2 lg:col-span-1 lg:row-span-2 lg:col-start-4 lg:row-start-1", pos: "50% 30%" },
      trousers: { cls: "lg:col-start-1 lg:row-start-3", pos: "50% 45%" },
      shoes: { cls: "lg:col-start-2 lg:row-start-3", pos: "50% 55%" },
      accessories: { cls: "lg:col-start-3 lg:row-start-3", pos: "50% 50%" },
      all: { cls: "lg:col-start-4 lg:row-start-3" },
    },
  },
};

/**
 * The hand-placed grid only fits the exact category set it was designed for. If an editor adds or
 * removes a category, `curated` is false and the section renders a plain uniform grid instead.
 */
export function pickLayout(g: Gender, slugs: string[]): { curated: boolean; layout: GridLayout } {
  const layout = LAYOUTS[g];
  const curated = slugs.length === layout.order.length && layout.order.every((s) => slugs.includes(s));
  return { curated, layout };
}

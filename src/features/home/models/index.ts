import type { Icon } from "@phosphor-icons/react";
import type { CategorySlug, Gender } from "@/models";

/** Copy and imagery for the home hero. */
export interface HeroCfg {
  /** Two headline lines. The second is highlighted. */
  lines: [string, string];
  sub: string;
  cta: string;
  /** Photo ID. */
  image: string;
  alt: string;
  /** CSS object-position for the photo. */
  pos: string;
  /** Product ID shown in the "Pictured" tag. */
  featured: string;
}

export interface TrustItem {
  icon: Icon;
  title: string;
  text: string;
}

export interface Review {
  /** Quote text. */
  q: string;
  /** Name. */
  n: string;
  /** Place. */
  w: string;
}

/** The sample gift played in the home teaser. */
export interface GiftDemo {
  productId: string;
  color: string;
  wrap: string;
  ribbon: string;
  message: string;
  from: string;
  to: string;
}

export interface GridPlace {
  /** Tailwind classes placing the tile on the mobile flow and the lg grid. */
  cls: string;
  /** CSS object-position for the tile photo. */
  pos?: string;
}

export interface CategoryGridCfg {
  /** Tailwind rows class for the lg grid. */
  rows: string;
  /** Order matches the DOM (mobile flow). */
  order: CategorySlug[];
  /** Placement per category slug, plus "all" for the call-to-action tile. */
  place: Record<string, GridPlace>;
}

export interface HomeCfg {
  hero: HeroCfg;
  trust: TrustItem[];
  catTitle: string;
  topTitle: string;
  gift: GiftDemo;
  reviews: { lead: Review; others: Review[] };
  grid: CategoryGridCfg;
}

/** Props shared by the gender-aware home sections. */
export interface HomeSectionProps {
  g: Gender;
}

export interface HeroSectionProps {
  g: Gender;
  c: HeroCfg;
}

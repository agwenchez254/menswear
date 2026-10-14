import type { CategoryDef, Gender, GiftBlock, HeroBlock, Product, Testimonial, TrustItem } from "@/models";

/** Props shared by the gender-aware home sections. */
export interface HomeSectionProps {
  g: Gender;
}

export interface HeroSectionProps {
  g: Gender;
  c: HeroBlock;
}

export interface TrustSectionProps {
  items: TrustItem[];
}

export interface CategoriesSectionProps extends HomeSectionProps {
  title: string;
  categories: CategoryDef[];
}

export interface TopSellingSectionProps extends HomeSectionProps {
  title: string;
  products: Product[];
}

export interface GiftTeaserSectionProps extends HomeSectionProps {
  c: GiftBlock;
}

export interface ReviewsSectionProps extends HomeSectionProps {
  items: Testimonial[];
}

import type { Gender } from "@/models";

/** Wire shapes returned by jabali-be `/store/*`. Adapters turn these into the UI models. */

export interface ApiColour {
  id: string;
  name: string;
  hex: string;
}

export interface ApiProductCard {
  id: string;
  slug: string;
  name: string;
  gender: Gender;
  category: { id: string; slug: string; label: string };
  price: number;
  compareAt: number | null;
  colours: ApiColour[];
  sizes: string[];
  image: string | null;
  isNew: boolean;
  isBestseller: boolean;
  rating: number;
  sold: number;
  inStock: boolean;
}

export interface ApiImage {
  id: string;
  url: string;
  alt: string;
}

export interface ApiVariant {
  id: string;
  sku: string;
  colourId: string | null;
  size: string;
  price: number;
  available: number;
  inStock: boolean;
  lowStock: boolean;
}

export interface ApiProductDetail extends ApiProductCard {
  blurb: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  images: ApiImage[];
  colours: (ApiColour & { images: ApiImage[] })[];
  variants: ApiVariant[];
}

export interface ApiCategory {
  id: string;
  gender: Gender;
  slug: string;
  label: string;
  tagline: string | null;
  image: string | null;
  productCount: number;
}

export interface ApiTestimonial {
  id: string;
  name: string;
  location: string;
  quote: string;
  rating: number;
  isLead: boolean;
  avatar: string | null;
}

export interface ApiBlock {
  key: string;
  kind: string;
  gender: Gender | null;
  version: number;
  data: unknown;
}

export interface ApiZone {
  id: string;
  code: string;
  name: string;
  counties: string[];
  fee: number;
  etaDays: number;
  eta: string;
  freeOver: number | null;
  sortOrder: number;
  active: boolean;
}

export interface ApiHome {
  gender: Gender | null;
  blocks: ApiBlock[];
  testimonials: ApiTestimonial[];
  categories: ApiCategory[];
  topProducts: ApiProductCard[];
  settings: Record<string, unknown>;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

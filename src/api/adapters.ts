import type { CategoryDef, DeliveryZoneInfo, GiftBlock, Gender, HeroBlock, HomeData, Product, ProductDetail, SectionsBlock, Testimonial, TrustItem } from "@/models";
import type { ApiCategory, ApiHome, ApiProductCard, ApiProductDetail, ApiTestimonial, ApiZone } from "./types";

export const toProduct = (c: ApiProductCard): Product => ({
  id: c.id,
  slug: c.slug,
  name: c.name,
  gender: c.gender,
  category: c.category.slug,
  categoryLabel: c.category.label,
  price: c.price,
  compareAt: c.compareAt ?? undefined,
  colors: c.colours.map(({ name, hex }) => ({ name, hex })),
  sizes: c.sizes,
  image: c.image,
  bestseller: c.isBestseller,
  isNew: c.isNew,
  rating: c.rating,
  sold: c.sold,
  inStock: c.inStock,
});

export const toProductDetail = (d: ApiProductDetail): ProductDetail => {
  const colourName = new Map(d.colours.map((c) => [c.id, c.name]));
  return {
    ...toProduct(d),
    blurb: d.blurb ?? "",
    images: d.images.map((i) => i.url),
    colorImages: Object.fromEntries(d.colours.map((c) => [c.name, c.images.map((i) => i.url)])),
    variants: d.variants.map((v) => ({
      id: v.id,
      colourName: v.colourId ? (colourName.get(v.colourId) ?? null) : null,
      size: v.size,
      available: v.available,
      inStock: v.inStock,
    })),
  };
};

export const toCategory = (c: ApiCategory): CategoryDef => ({ slug: c.slug, label: c.label, tag: c.tagline ?? "", image: c.image, count: c.productCount });

export const toTestimonial = (t: ApiTestimonial): Testimonial => ({ id: t.id, name: t.name, location: t.location, quote: t.quote });

export const toZoneInfo = (z: ApiZone): DeliveryZoneInfo => ({ id: z.id, label: z.name, fee: z.fee, eta: z.eta, freeOver: z.freeOver, counties: z.counties });

// ---- home blocks are free-form JSON edited in the dashboard: validate before trusting them.

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);

function asHero(v: unknown): HeroBlock | null {
  if (!isObj(v) || !Array.isArray(v.lines) || v.lines.length < 2) return null;
  return {
    lines: [str(v.lines[0]), str(v.lines[1])],
    sub: str(v.sub),
    cta: str(v.cta, "Shop now"),
    image: str(v.image),
    alt: str(v.alt),
    focalPoint: str(v.focalPoint, "50% 50%"),
    featuredProductSlug: str(v.featuredProductSlug),
  };
}

function asTrust(v: unknown): TrustItem[] {
  if (!isObj(v) || !Array.isArray(v.items)) return [];
  return v.items
    .filter(isObj)
    .map((i) => ({ icon: str(i.icon), title: str(i.title), text: str(i.text) }))
    .filter((i) => i.title !== "");
}

function asSections(v: unknown): SectionsBlock | null {
  if (!isObj(v)) return null;
  return { categoriesTitle: str(v.categoriesTitle), topProductsTitle: str(v.topProductsTitle) };
}

function asGift(v: unknown): GiftBlock | null {
  if (!isObj(v) || str(v.productSlug) === "") return null;
  return {
    productSlug: str(v.productSlug),
    colour: str(v.colour),
    wrap: str(v.wrap),
    ribbon: str(v.ribbon),
    message: str(v.message),
    from: str(v.from),
    to: str(v.to),
  };
}

/** Turns the `/store/home` bundle into what the home page renders. Block keys are `home.<part>.<gender>`. */
export function toHome(api: ApiHome, gender: Gender): HomeData {
  const block = (part: string): unknown => api.blocks.find((b) => b.key === `home.${part}.${gender}`)?.data;
  return {
    hero: asHero(block("hero")),
    trust: asTrust(block("trust")),
    sections: asSections(block("sections")),
    gift: asGift(block("gift")),
    testimonials: api.testimonials.map(toTestimonial),
    categories: api.categories.map(toCategory),
    topProducts: api.topProducts.map(toProduct),
  };
}

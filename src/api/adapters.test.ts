import assert from "node:assert/strict";
import { test } from "node:test";
import { toCategory, toHome, toProduct, toProductDetail, toTestimonial, toZoneInfo } from "./adapters.ts";

const card = {
  id: "p1", slug: "oxford", name: "Oxford", gender: "men" as const,
  category: { id: "c1", slug: "shirts", label: "Shirts" },
  price: 3200, compareAt: null, colours: [{ id: "k1", name: "White", hex: "#fff" }],
  sizes: ["S", "M"], image: "https://x/a.jpg", isNew: true, isBestseller: false, rating: 4.5, sold: 10, inStock: true,
};

test("toProduct maps names and turns null compareAt into undefined", () => {
  const p = toProduct(card);
  assert.equal(p.category, "shirts");
  assert.equal(p.categoryLabel, "Shirts");
  assert.equal(p.compareAt, undefined);
  assert.deepEqual(p.colors, [{ name: "White", hex: "#fff" }]);
  assert.equal(p.bestseller, false);
  assert.equal(p.isNew, true);
});

test("toProduct keeps a missing image as null", () => {
  assert.equal(toProduct({ ...card, image: null }).image, null);
});

test("toProductDetail builds per-colour galleries and variants", () => {
  const d = toProductDetail({
    ...card, blurb: null, seoTitle: null, seoDescription: null,
    images: [{ id: "i1", url: "https://x/shared.jpg", alt: "" }],
    colours: [{ id: "k1", name: "White", hex: "#fff", images: [{ id: "i2", url: "https://x/white.jpg", alt: "" }] }],
    variants: [
      { id: "v1", sku: "A", colourId: "k1", size: "S", price: 3200, available: 3, inStock: true, lowStock: false },
      { id: "v2", sku: "B", colourId: null, size: "M", price: 3200, available: 0, inStock: false, lowStock: false },
    ],
  });
  assert.equal(d.blurb, "");
  assert.deepEqual(d.images, ["https://x/shared.jpg"]);
  assert.deepEqual(d.colorImages, { White: ["https://x/white.jpg"] });
  assert.deepEqual(d.variants, [
    { id: "v1", colourName: "White", size: "S", available: 3, inStock: true },
    { id: "v2", colourName: null, size: "M", available: 0, inStock: false },
  ]);
});

test("toProductDetail copes with a product that has no images or variants", () => {
  const d = toProductDetail({ ...card, image: null, sizes: [], colours: [], blurb: "b", seoTitle: null, seoDescription: null, images: [], variants: [] });
  assert.deepEqual(d.images, []);
  assert.deepEqual(d.colorImages, {});
  assert.deepEqual(d.variants, []);
});

test("toCategory, toTestimonial and toZoneInfo rename fields", () => {
  assert.deepEqual(toCategory({ id: "c", gender: "men", slug: "suits", label: "Suits", tagline: null, image: null, productCount: 4 }), { slug: "suits", label: "Suits", tag: "", image: null, count: 4 });
  assert.deepEqual(toTestimonial({ id: "t", name: "A", location: "B", quote: "C", rating: 5, isLead: true, avatar: null }), { id: "t", name: "A", location: "B", quote: "C" });
  assert.deepEqual(toZoneInfo({ id: "z", code: "nairobi", name: "Nairobi", counties: ["Nairobi"], fee: 250, etaDays: 1, eta: "Same day", freeOver: 10000, sortOrder: 0, active: true }), { id: "z", label: "Nairobi", fee: 250, eta: "Same day", freeOver: 10000, counties: ["Nairobi"] });
});

const home = (blocks: { key: string; data: unknown }[]) =>
  toHome({ gender: "men", blocks: blocks.map((b) => ({ ...b, kind: "x", gender: "men" as const, version: 1 })), testimonials: [], categories: [], topProducts: [], settings: {} }, "men");

test("toHome picks the blocks for the requested gender by key", () => {
  const h = home([
    { key: "home.hero.men", data: { lines: ["A", "B"], sub: "s", cta: "c", image: "i", alt: "a", focalPoint: "1% 2%", featuredProductSlug: "oxford" } },
    { key: "home.hero.women", data: { lines: ["X", "Y"] } },
    { key: "home.trust.men", data: { items: [{ icon: "phone", title: "T", text: "x" }] } },
    { key: "home.sections.men", data: { categoriesTitle: "C", topProductsTitle: "T" } },
    { key: "home.gift.men", data: { productSlug: "oxford", colour: "White", wrap: "forest", ribbon: "gold", message: "m", from: "f", to: "t" } },
  ]);
  assert.deepEqual(h.hero?.lines, ["A", "B"]);
  assert.equal(h.trust[0].title, "T");
  assert.equal(h.sections?.categoriesTitle, "C");
  assert.equal(h.gift?.productSlug, "oxford");
});

test("toHome hides sections whose block is missing or malformed", () => {
  const h = home([
    { key: "home.hero.men", data: { lines: "not an array" } },
    { key: "home.trust.men", data: { items: "nope" } },
    { key: "home.gift.men", data: { colour: "White" } },
    { key: "home.sections.men", data: null },
  ]);
  assert.equal(h.hero, null);
  assert.deepEqual(h.trust, []);
  assert.equal(h.gift, null);
  assert.equal(h.sections, null);
  assert.equal(home([]).hero, null);
});

test("toHome drops trust items without a title and fills missing hero fields", () => {
  const h = home([
    { key: "home.trust.men", data: { items: [{ icon: "phone" }, { icon: "ruler", title: "Ok", text: "y" }, 7] } },
    { key: "home.hero.men", data: { lines: ["A", "B"] } },
  ]);
  assert.deepEqual(h.trust, [{ icon: "ruler", title: "Ok", text: "y" }]);
  assert.equal(h.hero?.cta, "Shop now");
  assert.equal(h.hero?.featuredProductSlug, "");
});

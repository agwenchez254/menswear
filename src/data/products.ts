/**
 * Product photography comes from Unsplash (free licence, no attribution required).
 * Each photo ID below was checked by eye. To use your own pictures, replace the
 * IDs in `photos` or point `images` at your own URLs.
 */
const photo = {
  suitNavyDetail: "1507679799987-c73779587ccf",
  suitPlaid: "1594938298603-c8148c4dae35",
  suitNavyWalking: "1617137968427-85924c800a22",
  shirtWhiteMan: "1621072156002-e2fccdc0b176",
  blazerTealMannequin: "1600091166971-7f9faad6c1e2",
  suitDarkArmsCrossed: "1519085360753-af0119f7cbe7",
  bomberSmile: "1492562080023-ab3db95bfbce",
  shirtsFolded: "1602810318383-e386cc2a3ccf",
  shirtBlueHanging: "1596755094514-f87e34085b2c",
  shirtWhiteTie: "1598033129183-c4f50c736f10",
  shirtBlueTie: "1620012253295-c15cc3e65df4",
  teeWhiteHanging: "1581655353564-df123a1eb820",
  teeWhiteMan: "1521572163474-6864f9cf17ab",
  teeBlackHanging: "1583743814966-8936f5b7be1a",
  teeBlackMan: "1503341504253-dff4815485f1",
  shoeLeatherClose: "1614252235316-8c857d38b5f4",
  shoeLeatherPair: "1449505278894-297fdb3edbc1",
  shoeMonk: "1533867617858-e7b97e060509",
  sneakerWhitePuma: "1608231387042-66d1773070a5",
  sneakerBlack: "1491553895911-0055eca6402d",
  jacketLeatherFlat: "1551028719-00167b16eac5",
  bomberRust: "1591047139829-d91aecb6caea",
  jacketLeatherMan: "1544022613-e87ca75a784a",
  chinosMan: "1473966968600-fa801b869a1a",
  jeansBlack: "1542272604-787c3835535d",
  jeansDark: "1624378439575-d8705ad7ae80",
  jeansStack: "1604176354204-9268737828e4",
  watchChrono: "1523170335258-f5ed11844a49",
  tieWood: "1589756823695-278bc923f962",
  watchSteel: "1620625515032-6ed0c1790c75",
  backpackNavy: "1553062407-98eeb64c6a62",
  flatlay: "1593030761757-71fae45fa0e7",
  // second batch
  shirtLightBlueMan: "1531427186611-ecfd6d936c79",
  jacketDarkMan: "1519764622345-23439dd774f7",
  blazerNavyGlasses: "1560250097-0b93528c311a",
  walletBrown: "1627123424574-724758594e93",
  nairobiSkyline: "1596005554384-d293674c91d7",
  suitMannequin: "1598808503746-f34c53b9323e",
  suitBlackWalking: "1618886614638-80e3c103d31a",
  poloFlatlay: "1586363104862-3a5e2ab60d99",
  teeGreenMan: "1566753323558-f4e0952af115",
  jacketTanMan: "1614252369475-531eba835eb1",
  jacketDarkWatch: "1507680434567-5739c80be1ac",
  suitGreen: "1593032465175-481ac7f401a0",
  navyHighCollar: "1531384441138-2736e62e0919",
};

export const img = (id: string, w = 900, h?: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}${h ? `&h=${h}` : ""}&q=75&auto=format&fit=crop`;

export { photo };

export type CategorySlug = "shirts" | "trousers" | "suits" | "shoes" | "tshirts" | "jackets" | "accessories" | "kaunda";

export interface Swatch {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  category: CategorySlug;
  price: number;
  compareAt?: number;
  colors: Swatch[];
  sizes: string[];
  /** Photo IDs. The first is the main image. */
  images: string[];
  bestseller?: boolean;
  isNew?: boolean;
  rating: number;
  sold: number;
  stock: number;
  blurb: string;
}

export const categories: { slug: CategorySlug; label: string; tag: string; image: string }[] = [
  { slug: "suits", label: "Suits & Blazers", tag: "Weddings, boardrooms, Sundays", image: photo.suitGreen },
  { slug: "shirts", label: "Shirts", tag: "Oxford, linen, poplin", image: photo.shirtWhiteTie },
  { slug: "shoes", label: "Shoes", tag: "Leather and sneakers", image: photo.shoeLeatherClose },
  { slug: "kaunda", label: "Kaunda", tag: "The classic, reworked", image: photo.navyHighCollar },
  { slug: "trousers", label: "Trousers", tag: "Chinos, wool, denim", image: photo.chinosMan },
  { slug: "jackets", label: "Jackets", tag: "Bombers and leather", image: photo.bomberRust },
  { slug: "tshirts", label: "T-Shirts & Polos", tag: "Heavy cotton basics", image: photo.teeWhiteMan },
  { slug: "accessories", label: "Accessories", tag: "Watches, ties, wallets", image: photo.watchChrono },
];

const CLOTHING = ["S", "M", "L", "XL", "XXL"];
const SHOES = ["39", "40", "41", "42", "43", "44", "45", "46"];
const WAIST = ["30", "32", "34", "36", "38", "40"];
const ONE = ["One size"];

const c = (name: string, hex: string): Swatch => ({ name, hex });
const white = c("White", "#f4f1ec");
const sky = c("Sky", "#bcd1e6");
const navy = c("Navy", "#1f2a44");
const charcoal = c("Charcoal", "#2f3237");
const black = c("Onyx", "#1c1917");
const olive = c("Olive", "#5b6140");
const sand = c("Sand", "#cdb895");
const burgundy = c("Burgundy", "#6b1f2a");
const tan = c("Tan", "#a8743e");
const brown = c("Brown", "#5a3a26");
const grey = c("Slate", "#7a808a");
const green = c("Forest", "#24493a");
const steel = c("Steel", "#9aa0a6");

type Seed = Omit<Product, "id" | "rating" | "sold" | "stock"> & { rating?: number; sold?: number; stock?: number };

const seeds: Seed[] = [
  // Shirts
  { name: "Oxford Button-Down", category: "shirts", price: 3200, colors: [white, sky, navy], sizes: CLOTHING, images: [photo.shirtWhiteTie, photo.shirtWhiteMan], bestseller: true, blurb: "Brushed cotton Oxford with a soft collar roll. Works open or tucked." },
  { name: "Linen Camp Shirt", category: "shirts", price: 2800, compareAt: 3400, colors: [sky, sand, white], sizes: CLOTHING, images: [photo.shirtLightBlueMan, photo.shirtBlueHanging], isNew: true, blurb: "Breathable linen for Mombasa afternoons and Nairobi weekends." },
  { name: "Slim Poplin Shirt", category: "shirts", price: 2400, colors: [sky, white, black], sizes: CLOTHING, images: [photo.shirtBlueTie, photo.shirtsFolded], blurb: "A crisp office staple cut close through the body." },
  { name: "Check Flannel Shirt", category: "shirts", price: 3600, colors: [burgundy, navy, olive], sizes: CLOTHING, images: [photo.shirtsFolded, photo.shirtBlueHanging], blurb: "Heavy brushed flannel for cold Nanyuki mornings." },
  // Trousers
  { name: "Pleated Chino", category: "trousers", price: 3800, colors: [sand, navy, olive], sizes: WAIST, images: [photo.chinosMan, photo.flatlay], bestseller: true, blurb: "Single pleat, tapered leg, and stretch where you need it." },
  { name: "Tailored Wool Trouser", category: "trousers", price: 5400, colors: [charcoal, navy, grey], sizes: WAIST, images: [photo.suitBlackWalking, photo.suitNavyWalking], blurb: "Wool blend with a clean drape. Hemmed free in Nairobi." },
  { name: "Straight Dark Jean", category: "trousers", price: 4200, compareAt: 4900, colors: [navy, black], sizes: WAIST, images: [photo.jeansDark, photo.jeansStack], blurb: "Rigid selvedge-look denim that fades the way you wear it." },
  { name: "Slim Fit Jean", category: "trousers", price: 3500, colors: [black, navy, grey], sizes: WAIST, images: [photo.jeansBlack, photo.jeansStack], isNew: true, blurb: "Mid-weight stretch denim with a slim, easy taper." },
  // Suits
  { name: "Two-Piece Charcoal Suit", category: "suits", price: 18500, colors: [charcoal, navy], sizes: CLOTHING, images: [photo.suitDarkArmsCrossed, photo.suitNavyDetail], bestseller: true, blurb: "Half-canvassed jacket with matching trousers. Alterations included." },
  { name: "Navy Single-Breasted Blazer", category: "suits", price: 9800, colors: [navy, charcoal], sizes: CLOTHING, images: [photo.suitNavyWalking, photo.blazerNavyGlasses], blurb: "Two buttons, notch lapel, real horn-effect buttons." },
  { name: "Windowpane Blazer", category: "suits", price: 11200, compareAt: 12800, colors: [grey, green], sizes: CLOTHING, images: [photo.blazerTealMannequin, photo.suitMannequin], blurb: "A textured check that photographs well in daylight." },
  { name: "Three-Piece Wedding Suit", category: "suits", price: 24500, colors: [navy, green, charcoal], sizes: CLOTHING, images: [photo.suitPlaid, photo.suitGreen], isNew: true, blurb: "Jacket, waistcoat and trousers. Book a fitting before the big day." },
  // Shoes
  { name: "Leather Oxford", category: "shoes", price: 7800, colors: [brown, black], sizes: SHOES, images: [photo.shoeLeatherClose, photo.shoeLeatherPair], bestseller: true, blurb: "Full-grain leather, stitched sole, a shine that lasts." },
  { name: "Double Monk Strap", category: "shoes", price: 8900, colors: [brown, black], sizes: SHOES, images: [photo.shoeMonk, photo.shoeLeatherClose], blurb: "Two buckles, a clean last, and a sole built for pavements." },
  { name: "Minimal Leather Sneaker", category: "shoes", price: 5600, compareAt: 6500, colors: [white, black], sizes: SHOES, images: [photo.sneakerWhitePuma, photo.sneakerBlack], blurb: "Clean court sneaker that goes with a suit or jeans." },
  { name: "Leather Derby", category: "shoes", price: 6900, colors: [brown, tan], sizes: SHOES, images: [photo.shoeLeatherPair, photo.shoeMonk], isNew: true, blurb: "Open-lacing derby, polished for long Friday lunches." },
  // T-shirts
  { name: "Heavy Cotton Tee", category: "tshirts", price: 1500, colors: [white, black, olive, sand], sizes: CLOTHING, images: [photo.teeWhiteMan, photo.teeWhiteHanging], bestseller: true, blurb: "240gsm cotton that holds its shape wash after wash." },
  { name: "Piqué Polo", category: "tshirts", price: 2200, colors: [navy, white, burgundy], sizes: CLOTHING, images: [photo.poloFlatlay, photo.teeGreenMan], blurb: "Knit collar, two-button placket, a smart weekend default." },
  { name: "Black Crew Tee", category: "tshirts", price: 1800, colors: [black, grey], sizes: CLOTHING, images: [photo.teeBlackHanging, photo.teeBlackMan], isNew: true, blurb: "A heavyweight black tee that sits right under a jacket." },
  // Jackets
  { name: "Rust Bomber", category: "jackets", price: 6200, colors: [tan, olive, black], sizes: CLOTHING, images: [photo.bomberRust, photo.bomberSmile], blurb: "Light bomber with ribbed trims and a zip front." },
  { name: "Leather Biker Jacket", category: "jackets", price: 14400, compareAt: 16200, colors: [black, brown], sizes: CLOTHING, images: [photo.jacketLeatherFlat, photo.jacketTanMan], blurb: "Soft-grain leather with a quilted shoulder and zipped cuffs." },
  { name: "Everyday Overshirt", category: "jackets", price: 5800, colors: [black, olive], sizes: CLOTHING, images: [photo.jacketDarkMan, photo.jacketDarkWatch], blurb: "A shirt-weight jacket for the walk between meetings." },
  // Accessories
  { name: "Woven Silk Tie", category: "accessories", price: 1400, colors: [navy, burgundy, charcoal], sizes: ONE, images: [photo.tieWood, photo.shirtWhiteTie], blurb: "7cm blade, hand-rolled edges." },
  { name: "Bifold Leather Wallet", category: "accessories", price: 2400, colors: [brown, black], sizes: ONE, images: [photo.walletBrown], isNew: true, blurb: "Six card slots, a coin pocket, and room for notes." },
  { name: "Steel Link Watch", category: "accessories", price: 9800, colors: [steel, black], sizes: ONE, images: [photo.watchSteel, photo.jacketDarkWatch], bestseller: true, blurb: "Steel case and bracelet, quartz movement, water resistant." },
  { name: "Chronograph Watch", category: "accessories", price: 14500, compareAt: 16900, colors: [steel, navy], sizes: ONE, images: [photo.watchChrono], blurb: "Three sub-dials, a rotating bezel and a sapphire-effect crystal." },
  { name: "Everyday Backpack", category: "accessories", price: 4800, colors: [navy, black], sizes: ONE, images: [photo.backpackNavy], blurb: "Padded laptop sleeve, water-resistant fabric, one tidy front pocket." },
  // Kaunda
  { name: "Kaunda Suit Set", category: "kaunda", price: 12500, colors: [navy, olive, charcoal], sizes: CLOTHING, images: [photo.navyHighCollar, photo.jacketDarkWatch], bestseller: true, blurb: "Jacket and trousers in a breathable twill, finished by hand." },
  { name: "Kaunda Shirt", category: "kaunda", price: 3900, colors: [white, sand, navy], sizes: CLOTHING, images: [photo.jacketDarkWatch, photo.navyHighCollar], blurb: "Mandarin collar and a patch pocket, ready for any occasion." },
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const products: Product[] = seeds.map((s, i) => ({
  ...s,
  id: slug(s.name),
  rating: s.rating ?? Math.round((4.1 + ((i * 37) % 9) / 10) * 10) / 10,
  sold: s.sold ?? 38 + ((i * 53) % 210) + (s.bestseller ? 160 : 0),
  stock: s.stock ?? 3 + ((i * 7) % 18),
}));

export const byId = (id: string) => products.find((p) => p.id === id);
export const byCategory = (slugName: string) => categories.find((x) => x.slug === slugName);

export const formatKES = (n: number) => `KES ${n.toLocaleString("en-KE")}`;

export const topSelling = [...products].sort((a, b) => b.sold - a.sold).slice(0, 5);

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
  // women
  wYellowSet: "1515886657613-9f3515b0c78f",
  wBurgundyCoat: "1483985988355-763728e1935b",
  wFloralDetail: "1496747611176-843222e1e57c",
  wStripedPants: "1509631179647-0177331693ae",
  wCheckCoat: "1485968579580-b6d095142e6e",
  wBlueCoat: "1539109136881-3be0616acf4b",
  wBlouseRack: "1490481651871-ab68de25d43d",
  wDenimDress: "1591369822096-ffd140ec948f",
  wRedMaxi: "1595777457583-95e059d581b8",
  wRedFloral: "1572804013309-59a88b7e92f1",
  wPlumDress: "1566174053879-31528523f8ae",
  wPinkCoat: "1485462537746-965f33f7f6a7",
  wKnitRack: "1445205170230-053b83016050",
  wRedBag: "1584917865442-de89df76afd3",
  wWickerBag: "1590874103328-eac38a683ce7",
  wFloralHeel: "1543163521-1bf539c55dd2",
  wGreenDerby: "1560343090-f0409e92791a",
  wCreamPump: "1535043934128-cf0b28d52f95",
  wNavyHeel: "1515347619252-60a4bf4fff4f",
  wEarrings: "1535632066927-ab7c9ab60908",
  wNecklace: "1599643478518-a784e5dc4c8f",
  wPearl: "1611085583191-a3b181a88401",
  wGreenShirts: "1523381210434-271e8be1f52b",
  wPoncho: "1434389677669-e08b4cac3105",
  wJacketRack: "1551488831-00ddcb6c6bd3",
  wChevronKnit: "1475180098004-ca77a66827be",
  wDenimJacket: "1517841905240-472988babdf9",
  wGreyBlazer: "1573496359142-b8d87734a5a2",
  wKnitRack2: "1512436991641-6745cdb1723f",
  wPatchedJean: "1541099649105-f69ad21f3246",
  wSkinnyJean: "1584370848010-d7fe6bc767ec",
  wGraphicTee: "1582418702059-97ebafb35d09",
  wBlackTee: "1583744946564-b52ac1c389c8",
};

export const img = (id: string, w = 900, h?: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}${h ? `&h=${h}` : ""}&q=75&auto=format&fit=crop`;

export { photo };

export type Gender = "men" | "women";

export type CategorySlug =
  | "shirts"
  | "trousers"
  | "suits"
  | "shoes"
  | "tshirts"
  | "jackets"
  | "accessories"
  | "kaunda"
  | "dresses"
  | "tops"
  | "knitwear";

export interface Swatch {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  gender: Gender;
  category: CategorySlug;
  price: number;
  compareAt?: number;
  colors: Swatch[];
  sizes: string[];
  /** Photo IDs. The first is the main image. */
  images: string[];
  /** Optional photos per colour name. Colours not listed fall back to `images`. */
  colorImages?: Record<string, string[]>;
  bestseller?: boolean;
  isNew?: boolean;
  rating: number;
  sold: number;
  stock: number;
  blurb: string;
}

export interface CategoryDef {
  slug: CategorySlug;
  label: string;
  tag: string;
  image: string;
}

export const categoriesByGender: Record<Gender, CategoryDef[]> = {
  men: [
    { slug: "suits", label: "Suits & Blazers", tag: "Weddings, boardrooms, Sundays", image: photo.suitGreen },
    { slug: "shirts", label: "Shirts", tag: "Oxford, linen, poplin", image: photo.shirtWhiteTie },
    { slug: "shoes", label: "Shoes", tag: "Leather and sneakers", image: photo.shoeLeatherClose },
    { slug: "kaunda", label: "Kaunda", tag: "The classic, reworked", image: photo.jacketDarkWatch },
    { slug: "trousers", label: "Trousers", tag: "Chinos, wool, denim", image: photo.chinosMan },
    { slug: "jackets", label: "Jackets", tag: "Bombers and leather", image: photo.bomberRust },
    { slug: "tshirts", label: "T-Shirts & Polos", tag: "Heavy cotton basics", image: photo.teeWhiteMan },
    { slug: "accessories", label: "Accessories", tag: "Watches, ties, wallets", image: photo.watchChrono },
  ],
  women: [
    { slug: "dresses", label: "Dresses", tag: "Day, evening and everything between", image: photo.wRedFloral },
    { slug: "tops", label: "Tops", tag: "Blouses, shirts and tees", image: photo.wBlouseRack },
    { slug: "knitwear", label: "Knitwear", tag: "Soft layers", image: photo.wChevronKnit },
    { slug: "jackets", label: "Coats & Jackets", tag: "Wool, denim, tailoring", image: photo.wBlueCoat },
    { slug: "trousers", label: "Trousers & Jeans", tag: "Wide-leg to skinny", image: photo.wStripedPants },
    { slug: "shoes", label: "Shoes", tag: "Heels and flats", image: photo.wFloralHeel },
    { slug: "accessories", label: "Bags & Jewellery", tag: "Finishing touches", image: photo.wRedBag },
  ],
};

/** Men's categories, kept under the old name for older imports. */
export const categories = categoriesByGender.men;

const CLOTHING = ["S", "M", "L", "XL", "XXL"];
const SHOES = ["39", "40", "41", "42", "43", "44", "45", "46"];
const WAIST = ["30", "32", "34", "36", "38", "40"];
const ONE = ["One size"];
const WCLOTH = ["XS", "S", "M", "L", "XL"];
const WSHOES = ["36", "37", "38", "39", "40", "41"];
const WJEAN = ["26", "28", "30", "32", "34"];

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
const blush = c("Blush", "#e3b7b0");
const rose = c("Rose", "#b5495b");
const plum = c("Plum", "#5a2a4a");
const sage = c("Sage", "#8ea58e");
const camel = c("Camel", "#b58b5a");
const ivory = c("Ivory", "#efe9de");
const crimson = c("Crimson", "#b3202d");
const denim = c("Denim", "#5f7fa6");
const cobalt = c("Cobalt", "#2a4b8a");
const gold = c("Gold", "#c9a24b");

type Seed = Omit<Product, "id" | "gender" | "rating" | "sold" | "stock"> & { gender?: Gender; rating?: number; sold?: number; stock?: number };

const seeds: Seed[] = [
  // Shirts
  { name: "Oxford Button-Down", category: "shirts", price: 3200, colors: [white, sky, navy], sizes: CLOTHING, images: [photo.shirtWhiteTie, photo.shirtWhiteMan], colorImages: { "White": [photo.shirtWhiteTie, photo.shirtWhiteMan], "Sky": [photo.shirtLightBlueMan, photo.shirtBlueTie] }, bestseller: true, blurb: "Brushed cotton Oxford with a soft collar roll. Works open or tucked." },
  { name: "Linen Camp Shirt", category: "shirts", price: 2800, compareAt: 3400, colors: [sky, sand, white], sizes: CLOTHING, images: [photo.shirtLightBlueMan, photo.shirtBlueHanging], colorImages: { "Sky": [photo.shirtLightBlueMan, photo.shirtBlueHanging] }, isNew: true, blurb: "Breathable linen for Mombasa afternoons and Nairobi weekends." },
  { name: "Slim Poplin Shirt", category: "shirts", price: 2400, colors: [sky, white, black], sizes: CLOTHING, images: [photo.shirtBlueTie, photo.shirtsFolded], colorImages: { "Sky": [photo.shirtBlueTie, photo.shirtBlueHanging], "White": [photo.shirtWhiteTie, photo.shirtWhiteMan] }, blurb: "A crisp office staple cut close through the body." },
  { name: "Check Flannel Shirt", category: "shirts", price: 3600, colors: [burgundy, navy, olive], sizes: CLOTHING, images: [photo.shirtsFolded, photo.shirtBlueHanging], blurb: "Heavy brushed flannel for cold Nanyuki mornings." },
  // Trousers
  { name: "Pleated Chino", category: "trousers", price: 3800, colors: [sand, navy, olive], sizes: WAIST, images: [photo.chinosMan, photo.flatlay], bestseller: true, blurb: "Single pleat, tapered leg, and stretch where you need it." },
  { name: "Tailored Wool Trouser", category: "trousers", price: 5400, colors: [charcoal, navy, grey], sizes: WAIST, images: [photo.suitBlackWalking, photo.suitNavyWalking], blurb: "Wool blend with a clean drape. Hemmed free in Nairobi." },
  { name: "Straight Dark Jean", category: "trousers", price: 4200, compareAt: 4900, colors: [navy, black], sizes: WAIST, images: [photo.jeansDark, photo.jeansStack], colorImages: { "Onyx": [photo.jeansBlack, photo.jeansStack], "Navy": [photo.jeansDark, photo.jeansStack] }, blurb: "Rigid selvedge-look denim that fades the way you wear it." },
  { name: "Slim Fit Jean", category: "trousers", price: 3500, colors: [black, navy, grey], sizes: WAIST, images: [photo.jeansBlack, photo.jeansStack], colorImages: { "Onyx": [photo.jeansBlack, photo.jeansStack], "Navy": [photo.jeansDark, photo.jeansStack] }, isNew: true, blurb: "Mid-weight stretch denim with a slim, easy taper." },
  // Suits
  { name: "Two-Piece Charcoal Suit", category: "suits", price: 18500, colors: [charcoal, navy], sizes: CLOTHING, images: [photo.suitDarkArmsCrossed, photo.suitNavyDetail], colorImages: { "Navy": [photo.suitNavyDetail, photo.suitNavyWalking], "Charcoal": [photo.suitDarkArmsCrossed, photo.suitBlackWalking] }, bestseller: true, sold: 612, blurb: "Half-canvassed jacket with matching trousers. Alterations included." },
  { name: "Navy Single-Breasted Blazer", category: "suits", price: 9800, colors: [navy, charcoal], sizes: CLOTHING, images: [photo.suitNavyWalking, photo.blazerNavyGlasses], blurb: "Two buttons, notch lapel, real horn-effect buttons." },
  { name: "Windowpane Blazer", category: "suits", price: 11200, compareAt: 12800, colors: [grey, green], sizes: CLOTHING, images: [photo.blazerTealMannequin, photo.suitMannequin], blurb: "A textured check that photographs well in daylight." },
  { name: "Three-Piece Wedding Suit", category: "suits", price: 24500, colors: [navy, green, charcoal], sizes: CLOTHING, images: [photo.suitPlaid, photo.suitGreen], colorImages: { "Navy": [photo.suitNavyWalking, photo.suitNavyDetail], "Forest": [photo.suitGreen] }, isNew: true, blurb: "Jacket, waistcoat and trousers. Book a fitting before the big day." },
  // Shoes
  { name: "Leather Oxford", category: "shoes", price: 7800, colors: [brown, black], sizes: SHOES, images: [photo.shoeLeatherClose, photo.shoeLeatherPair], bestseller: true, blurb: "Full-grain leather, stitched sole, a shine that lasts." },
  { name: "Double Monk Strap", category: "shoes", price: 8900, colors: [brown, black], sizes: SHOES, images: [photo.shoeMonk, photo.shoeLeatherClose], blurb: "Two buckles, a clean last, and a sole built for pavements." },
  { name: "Minimal Leather Sneaker", category: "shoes", price: 5600, compareAt: 6500, colors: [white, black], sizes: SHOES, images: [photo.sneakerWhitePuma, photo.sneakerBlack], colorImages: { "White": [photo.sneakerWhitePuma], "Onyx": [photo.sneakerBlack] }, blurb: "Clean court sneaker that goes with a suit or jeans." },
  { name: "Leather Derby", category: "shoes", price: 6900, colors: [brown, tan], sizes: SHOES, images: [photo.shoeLeatherPair, photo.shoeMonk], isNew: true, blurb: "Open-lacing derby, polished for long Friday lunches." },
  // T-shirts
  { name: "Heavy Cotton Tee", category: "tshirts", price: 1500, colors: [white, black, olive, sand], sizes: CLOTHING, images: [photo.teeWhiteMan, photo.teeWhiteHanging], colorImages: { "White": [photo.teeWhiteMan, photo.teeWhiteHanging], "Onyx": [photo.teeBlackMan, photo.teeBlackHanging], "Olive": [photo.teeGreenMan] }, bestseller: true, blurb: "240gsm cotton that holds its shape wash after wash." },
  { name: "Piqué Polo", category: "tshirts", price: 2200, colors: [navy, white, burgundy], sizes: CLOTHING, images: [photo.poloFlatlay, photo.teeGreenMan], blurb: "Knit collar, two-button placket, a smart weekend default." },
  { name: "Black Crew Tee", category: "tshirts", price: 1800, colors: [black, grey], sizes: CLOTHING, images: [photo.teeBlackHanging, photo.teeBlackMan], colorImages: { "Onyx": [photo.teeBlackMan, photo.teeBlackHanging] }, isNew: true, blurb: "A heavyweight black tee that sits right under a jacket." },
  // Jackets
  { name: "Rust Bomber", category: "jackets", price: 6200, colors: [tan, olive, black], sizes: CLOTHING, images: [photo.bomberRust, photo.bomberSmile], blurb: "Light bomber with ribbed trims and a zip front." },
  { name: "Leather Biker Jacket", category: "jackets", price: 14400, compareAt: 16200, colors: [black, brown], sizes: CLOTHING, images: [photo.jacketLeatherFlat, photo.jacketTanMan], blurb: "Soft-grain leather with a quilted shoulder and zipped cuffs." },
  { name: "Everyday Overshirt", category: "jackets", price: 5800, colors: [black, olive], sizes: CLOTHING, images: [photo.jacketTanMan, photo.jacketDarkMan], blurb: "A shirt-weight jacket for the walk between meetings." },
  // Accessories
  { name: "Woven Silk Tie", category: "accessories", price: 1400, colors: [navy, burgundy, charcoal], sizes: ONE, images: [photo.tieWood, photo.shirtWhiteTie], blurb: "7cm blade, hand-rolled edges." },
  { name: "Bifold Leather Wallet", category: "accessories", price: 2400, colors: [brown, black], sizes: ONE, images: [photo.walletBrown], isNew: true, blurb: "Six card slots, a coin pocket, and room for notes." },
  { name: "Two-Tone Dress Watch", category: "accessories", price: 9800, colors: [steel, tan], sizes: ONE, images: [photo.watchSteel, photo.jacketDarkWatch], bestseller: true, blurb: "Steel case and bracelet, quartz movement, water resistant." },
  { name: "Chronograph Watch", category: "accessories", price: 14500, compareAt: 16900, colors: [steel, navy], sizes: ONE, images: [photo.watchChrono], blurb: "Three sub-dials, a rotating bezel and a sapphire-effect crystal." },
  { name: "Everyday Backpack", category: "accessories", price: 4800, colors: [navy, black], sizes: ONE, images: [photo.backpackNavy], blurb: "Padded laptop sleeve, water-resistant fabric, one tidy front pocket." },
  // Kaunda
  { name: "Kaunda Suit Set", category: "kaunda", price: 12500, colors: [navy, olive, charcoal], sizes: CLOTHING, images: [photo.jacketDarkWatch, photo.jacketDarkMan], bestseller: true, blurb: "Jacket and trousers in a breathable twill, finished by hand." },
  { name: "Kaunda Shirt", category: "kaunda", price: 3900, colors: [white, sand, navy], sizes: CLOTHING, images: [photo.jacketDarkMan, photo.jacketDarkWatch], blurb: "Mandarin collar and a patch pocket, ready for any occasion." },

  // ---------- Women ----------
  // Dresses
  { gender: "women", name: "Floral Wrap Dress", category: "dresses", price: 4800, colors: [ivory, rose, sage], sizes: WCLOTH, images: [photo.wRedFloral, photo.wFloralDetail], bestseller: true, sold: 540, blurb: "A fluid wrap with a tie waist that moves well from brunch to the evening." },
  { gender: "women", name: "Denim Shirt Dress", category: "dresses", price: 4200, colors: [denim, black], sizes: WCLOTH, images: [photo.wDenimDress], bestseller: true, sold: 380, blurb: "Button-through denim with a flared skirt. Dress it up with heels or down with sneakers." },
  { gender: "women", name: "Crimson Maxi Dress", category: "dresses", price: 7800, compareAt: 9200, colors: [crimson, plum], sizes: WCLOTH, images: [photo.wRedMaxi, photo.wPlumDress], blurb: "A full skirt that catches the light. Made for weddings and long evenings." },
  { gender: "women", name: "Plum Off-Shoulder Dress", category: "dresses", price: 6900, colors: [plum, rose], sizes: WCLOTH, images: [photo.wPlumDress, photo.wRedMaxi], isNew: true, blurb: "Stretch crepe with a sculpted neckline and a clean, fitted line." },
  // Tops
  { gender: "women", name: "Pearl-Button Blouse", category: "tops", price: 3200, colors: [ivory, blush], sizes: WCLOTH, images: [photo.wBlouseRack, photo.wPearl], blurb: "A relaxed cotton blouse with pearl-effect buttons. Wear it open over a tee." },
  { gender: "women", name: "Sage Cotton Shirt", category: "tops", price: 2800, colors: [sage, ivory], sizes: WCLOTH, images: [photo.wGreenShirts], isNew: true, blurb: "Washed cotton poplin in a soft, grown-in green." },
  { gender: "women", name: "Roll-Sleeve Tee", category: "tops", price: 1600, colors: [black, ivory], sizes: WCLOTH, images: [photo.wBlackTee], blurb: "A heavy cotton tee with a slightly boxy cut and rolled sleeves." },
  { gender: "women", name: "Weekend Graphic Tee", category: "tops", price: 1800, colors: [black, ivory], sizes: WCLOTH, images: [photo.wGraphicTee], blurb: "Soft jersey with a front print. Goes with every pair of jeans we make." },
  // Knitwear
  { gender: "women", name: "Fringe Knit Poncho", category: "knitwear", price: 3900, colors: [ivory, camel], sizes: ONE, images: [photo.wPoncho], bestseller: true, sold: 290, blurb: "An open-weave knit with fringed hems. One size, easy to layer." },
  { gender: "women", name: "Chevron Knit Sweater", category: "knitwear", price: 4400, colors: [camel, ivory], sizes: WCLOTH, images: [photo.wChevronKnit], blurb: "A chunky zig-zag knit that keeps out the Nairobi evening chill." },
  { gender: "women", name: "Soft Rib Cardigan", category: "knitwear", price: 4600, compareAt: 5400, colors: [ivory, camel, blush], sizes: WCLOTH, images: [photo.wKnitRack2, photo.wKnitRack], blurb: "A longline cardigan in a ribbed, brushed knit." },
  // Coats and jackets
  { gender: "women", name: "Burgundy Wool Coat", category: "jackets", price: 11800, colors: [rose, plum], sizes: WCLOTH, images: [photo.wBurgundyCoat], bestseller: true, sold: 700, blurb: "A tailored wool-blend coat with a deep collar and clean lines." },
  { gender: "women", name: "Powder Blue Belted Coat", category: "jackets", price: 12600, colors: [sky, ivory], sizes: WCLOTH, images: [photo.wBlueCoat], isNew: true, blurb: "A belted wrap coat in a cool, pale blue." },
  { gender: "women", name: "Check Blazer", category: "jackets", price: 8900, colors: [navy, grey], sizes: WCLOTH, images: [photo.wCheckCoat, photo.wGreyBlazer], blurb: "A boyfriend-cut blazer in a subtle check. Wear it with everything." },
  { gender: "women", name: "Classic Denim Jacket", category: "jackets", price: 5400, colors: [denim, black], sizes: WCLOTH, images: [photo.wDenimJacket, photo.wJacketRack], blurb: "A washed trucker jacket that gets better with every wear." },
  { gender: "women", name: "Blush Longline Coat", category: "jackets", price: 10400, compareAt: 12200, colors: [blush, camel], sizes: WCLOTH, images: [photo.wPinkCoat], blurb: "A longline coat in soft blush, cut to sit just below the knee." },
  // Trousers and jeans
  { gender: "women", name: "Striped Wide-Leg Trouser", category: "trousers", price: 4600, colors: [black, ivory], sizes: WCLOTH, images: [photo.wStripedPants], bestseller: true, sold: 260, blurb: "High-waist wide legs with a bold pinstripe. Movement in every step." },
  { gender: "women", name: "High-Rise Skinny Jean", category: "trousers", price: 3800, colors: [denim, black], sizes: WJEAN, images: [photo.wSkinnyJean], blurb: "Stretch denim with a high waist and an ankle-length hem." },
  { gender: "women", name: "Patched Straight Jean", category: "trousers", price: 4200, colors: [denim, navy], sizes: WJEAN, images: [photo.wPatchedJean], blurb: "Relaxed straight legs with sewn-on patches and a distressed knee." },
  { gender: "women", name: "Sunshine Jogger Set", category: "trousers", price: 5200, colors: [gold, grey], sizes: WCLOTH, images: [photo.wYellowSet], isNew: true, blurb: "A cropped hoodie and jogger set in heavy brushed fleece." },
  // Shoes
  { gender: "women", name: "Cream Court Pump", category: "shoes", price: 6400, colors: [ivory, black], sizes: WSHOES, images: [photo.wCreamPump], bestseller: true, sold: 310, blurb: "A pointed pump with a 7cm heel. Comfortable enough for a full day." },
  { gender: "women", name: "Navy Suede Heel", category: "shoes", price: 6900, colors: [navy, plum], sizes: WSHOES, images: [photo.wNavyHeel], blurb: "Suede-effect court shoe with a slim gold-tone heel." },
  { gender: "women", name: "Floral Stiletto", category: "shoes", price: 7400, compareAt: 8600, colors: [cobalt, rose], sizes: WSHOES, images: [photo.wFloralHeel], isNew: true, blurb: "A printed stiletto that makes the whole outfit." },
  { gender: "women", name: "Green Suede Derby", category: "shoes", price: 5800, colors: [sage, brown], sizes: WSHOES, images: [photo.wGreenDerby], blurb: "A flat lace-up in soft suede. Wear it with tailoring or a skirt." },
  // Bags and jewellery
  { gender: "women", name: "Red Top-Handle Bag", category: "accessories", price: 8800, colors: [crimson, black], sizes: ONE, images: [photo.wRedBag], bestseller: true, sold: 270, blurb: "Structured leather-look bag with a turn-lock and a detachable strap." },
  { gender: "women", name: "Woven Straw Handbag", category: "accessories", price: 5600, colors: [camel], sizes: ONE, images: [photo.wWickerBag], blurb: "A hand-woven top-handle bag with a leather trim." },
  { gender: "women", name: "Crystal Drop Earrings", category: "accessories", price: 2400, colors: [steel, gold], sizes: ONE, images: [photo.wEarrings], blurb: "Statement earrings with a sapphire-tone centre." },
  { gender: "women", name: "Layered Pendant Necklace", category: "accessories", price: 2900, colors: [gold], sizes: ONE, images: [photo.wNecklace], isNew: true, blurb: "Three fine chains with a crescent and stone pendant." },
  { gender: "women", name: "Pearl Pendant", category: "accessories", price: 1900, colors: [gold, steel], sizes: ONE, images: [photo.wPearl], blurb: "A single pearl on a fine chain. Wear it every day." },
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const products: Product[] = seeds.map((s, i) => ({
  ...s,
  gender: s.gender ?? "men",
  id: slug(s.name),
  rating: s.rating ?? Math.round((4.1 + ((i * 37) % 9) / 10) * 10) / 10,
  sold: s.sold ?? 38 + ((i * 53) % 210) + (s.bestseller ? 160 : 0),
  stock: s.stock ?? 3 + ((i * 7) % 18),
}));

export const byId = (id: string) => products.find((p) => p.id === id);
export const byCategory = (slugName: string, g?: Gender) =>
  (g ? categoriesByGender[g] : [...categoriesByGender.men, ...categoriesByGender.women]).find((x) => x.slug === slugName);

export const formatKES = (n: number) => `KES ${n.toLocaleString("en-KE")}`;

export const productsFor = (g: Gender) => products.filter((p) => p.gender === g);
export const topSellingFor = (g: Gender) => [...productsFor(g)].sort((a, b) => b.sold - a.sold).slice(0, 5);

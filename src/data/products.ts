import type { CategoryDef, Gender, Product, ProductSeed, Swatch } from "@/models";
import { photo } from "@/data/photos";
import { categoriesByGender } from "@/data/categories";

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


const seeds: ProductSeed[] = [
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

export const byId = (id: string): Product | undefined => products.find((p) => p.id === id);
export const byCategory = (slugName: string, g?: Gender): CategoryDef | undefined =>
  (g ? categoriesByGender[g] : [...categoriesByGender.men, ...categoriesByGender.women]).find((x) => x.slug === slugName);

export const productsFor = (g: Gender): Product[] => products.filter((p) => p.gender === g);
export const topSellingFor = (g: Gender): Product[] => [...productsFor(g)].sort((a, b) => b.sold - a.sold).slice(0, 5);

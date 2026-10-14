import { HandCoins, Package, Phone, Ruler } from "@phosphor-icons/react";
import type { Gender } from "@/models";
import type { HomeCfg, TrustItem } from "@/features/home/models";
import { photo } from "@/data/photos";

const trustMen: TrustItem[] = [
  { icon: Phone, title: "Pay with M-Pesa", text: "STK push to your phone. No card needed." },
  { icon: Package, title: "Delivery nationwide", text: "Same-day in Nairobi, up to 5 days upcountry." },
  { icon: Ruler, title: "Free alterations", text: "Suits hemmed at our CBD studio." },
  { icon: HandCoins, title: "Pay on delivery", text: "Available in Nairobi. Try before you pay." },
];
const trustWomen: TrustItem[] = [
  { icon: Phone, title: "Pay with M-Pesa", text: "STK push to your phone. No card needed." },
  { icon: Package, title: "Delivery nationwide", text: "Same-day in Nairobi, up to 5 days upcountry." },
  { icon: Ruler, title: "Free hemming", text: "Dresses and trousers adjusted at our studio." },
  { icon: HandCoins, title: "Pay on delivery", text: "Available in Nairobi. Try before you pay." },
];

/** Copy, imagery and grid layout for each side of the store. */
export const homeConfig: Record<Gender, HomeCfg> = {
  men: {
    hero: {
      lines: ["Sharp suits.", "Sent anywhere."],
      sub: "Tailored menswear for Kenyan life, from Nairobi boardrooms to Kisumu weddings. Pay with M-Pesa and get it delivered fast.",
      cta: "Shop menswear",
      image: photo.suitGreen,
      alt: "Man adjusting the button of a forest green suit",
      pos: "50% 22%",
      featured: "three-piece-wedding-suit",
    },
    trust: trustMen,
    catTitle: "Start with what you need",
    topTitle: "What Nairobi is wearing",
    gift: { productId: "oxford-button-down", color: "White", wrap: "forest", ribbon: "gold", message: "Congratulations on the new job. Wear it well.", from: "Wanjiru", to: "Baba" },
    reviews: {
      lead: { q: "Ordered the charcoal suit on Tuesday for my brother’s wedding. It reached Machakos on Thursday and fit perfectly.", n: "Kelvin Mutiso", w: "Machakos" },
      others: [
        { q: "The gift box opening on his phone had my husband grinning before he touched the shirt.", n: "Achieng’ Odhiambo", w: "Kisumu" },
        { q: "Paid by M-Pesa in under a minute. The Oxfords came boxed and polished.", n: "Mwangi Gathogo", w: "Kilimani, Nairobi" },
        { q: "Sizing guide was spot on. The Kaunda suit needed no alterations before the ceremony.", n: "Otieno Ouma", w: "Kakamega" },
        { q: "Wrapped, carded and delivered to my dad in Nyeri the next day. He kept the box.", n: "Brian Kiprop", w: "Nyeri" },
        { q: "Third order now. The shirts hold their shape wash after wash.", n: "Hassan Abdi", w: "Eastleigh, Nairobi" },
      ],
    },
    grid: {
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
  },
  women: {
    hero: {
      lines: ["Wear what", "feels like you."],
      sub: "Dresses, tailoring and everyday basics for Kenyan women. Pay with M-Pesa and get it delivered to your door.",
      cta: "Shop womenswear",
      image: photo.wRedFloral,
      alt: "Woman smiling in a red floral dress against a warm yellow wall",
      pos: "50% 30%",
      featured: "floral-wrap-dress",
    },
    trust: trustWomen,
    catTitle: "Find your next favourite",
    topTitle: "What Nairobi is loving",
    gift: { productId: "denim-shirt-dress", color: "Denim", wrap: "midnight", ribbon: "cream", message: "Happy birthday, mama. You deserve something lovely.", from: "Njeri", to: "Mama" },
    reviews: {
      lead: { q: "The denim shirt dress reached Eldoret in two days and fits like it was made for me.", n: "Naliaka Wekesa", w: "Eldoret" },
      others: [
        { q: "I paid by M-Pesa from my desk. The coat was at my door by Friday.", n: "Zawadi Mwikali", w: "Mombasa" },
        { q: "The gift reveal made my sister cry on a video call, in the best way.", n: "Amina Said", w: "South B, Nairobi" },
        { q: "Bought two dresses for a family trip. Both arrived pressed and perfectly packed.", n: "Cynthia Chebet", w: "Nakuru" },
        { q: "Customer care answered on WhatsApp within minutes and sorted my exchange.", n: "Faith Njoroge", w: "Thika" },
        { q: "The knitwear is softer than anything I have found in town. Already ordered another.", n: "Lilian Atieno", w: "Kisii" },
      ],
    },
    grid: {
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
  },
};

import type { Zone } from "@/models";

export const zones: Zone[] = [
  {
    id: "nairobi",
    label: "Nairobi",
    fee: 250,
    eta: "Same-day if ordered before 2 pm, otherwise next day",
    counties: ["Nairobi"],
  },
  {
    id: "metro",
    label: "Nairobi metro",
    fee: 350,
    eta: "1 to 2 working days",
    counties: ["Kiambu", "Kajiado", "Machakos", "Murang'a"],
  },
  {
    id: "regional",
    label: "Major towns",
    fee: 450,
    eta: "2 to 3 working days",
    counties: ["Mombasa", "Kisumu", "Nakuru", "Uasin Gishu", "Nyeri", "Meru", "Kisii", "Kakamega", "Kilifi", "Embu", "Laikipia", "Bungoma"],
  },
  {
    id: "far",
    label: "Other counties",
    fee: 650,
    eta: "3 to 5 working days",
    counties: ["Garissa", "Isiolo", "Kitui", "Makueni", "Nandi", "Narok", "Turkana", "Kericho", "Bomet", "Migori", "Homa Bay", "Siaya", "Busia", "Vihiga", "Trans Nzoia", "Baringo", "Taita Taveta", "Lamu", "Tana River", "Marsabit", "Wajir", "Mandera", "Samburu", "West Pokot", "Elgeyo Marakwet", "Nyandarua", "Nyamira", "Kirinyaga", "Tharaka Nithi", "Kwale", "Vihiga"],
  },
];

/** Every county we deliver to, alphabetised for the checkout dropdown. */
export const allCounties: string[] = [...new Set(zones.flatMap((z) => z.counties))].sort();

export const zoneFor = (county: string): Zone | undefined => zones.find((z) => z.counties.includes(county));

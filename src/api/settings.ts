import type { PaymentMethod } from "@/features/checkout/models";
import { baseApi } from "./baseApi";

export interface Promotion {
  text: string;
  /** Call-to-action target: an in-app path ("/shop") or a full URL. */
  link?: string;
  linkLabel?: string;
}

export interface SiteSettings {
  whatsappNumber: string;
  paymentMethods: PaymentMethod[];
  pickupAddress: string;
  /** KES added per gift-wrapped unit. The server adds it when pricing; this is only for display. */
  giftFee: number;
  /** Set only when the admin has the banner switched on and given it text. */
  promotion: Promotion | null;
}

/** Used until the API answers (or if it fails) so checkout and contact links never render empty. */
export const DEFAULT_SETTINGS: SiteSettings = {
  whatsappNumber: "+254712480316",
  paymentMethods: ["mpesa", "airtel", "card", "cod"],
  pickupAddress: "Jabali Studio, 2nd Floor, Kimathi House, Kimathi Street, Nairobi CBD",
  giftFee: 350,
  promotion: null,
};

const METHODS: readonly string[] = DEFAULT_SETTINGS.paymentMethods;

function toPromotion(v: unknown): Promotion | null {
  if (!v || typeof v !== "object") return null;
  const b = v as Record<string, unknown>;
  const text = typeof b.text === "string" ? b.text.trim() : "";
  if (b.enabled !== true || !text) return null;
  const link = typeof b.link === "string" ? b.link.trim() : "";
  const linkLabel = typeof b.linkLabel === "string" ? b.linkLabel.trim() : "";
  return { text, ...(link && { link, linkLabel: linkLabel || "Shop now" }) };
}

function toSettings(r: Record<string, unknown>): SiteSettings {
  const wa = typeof r.whatsappNumber === "string" ? r.whatsappNumber.trim() : "";
  const methods = Array.isArray(r.paymentMethods) ? (r.paymentMethods.filter((m) => METHODS.includes(m as string)) as PaymentMethod[]) : [];
  return {
    whatsappNumber: wa || DEFAULT_SETTINGS.whatsappNumber,
    paymentMethods: methods.length ? methods : DEFAULT_SETTINGS.paymentMethods,
    pickupAddress: typeof r.pickupAddress === "string" && r.pickupAddress.trim() ? r.pickupAddress.trim() : DEFAULT_SETTINGS.pickupAddress,
    giftFee: typeof r.giftFee === "number" && r.giftFee >= 0 ? r.giftFee : DEFAULT_SETTINGS.giftFee,
    promotion: toPromotion(r.announcementBar),
  };
}

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getSettings: b.query<SiteSettings, void>({
      query: () => "/settings",
      transformResponse: toSettings,
      providesTags: ["Settings"],
    }),
  }),
});

export const { useGetSettingsQuery } = settingsApi;

/** Admin-managed site settings, with safe defaults while loading. */
export function useSiteSettings() {
  const { data } = useGetSettingsQuery();
  const s = data ?? DEFAULT_SETTINGS;
  let digits = s.whatsappNumber.replace(/\D/g, "");
  // wa.me needs the country code: 0792… / 792… (Kenyan local formats) become 254792…
  if (/^0[17]\d{8}$/.test(digits)) digits = `254${digits.slice(1)}`;
  else if (/^[17]\d{8}$/.test(digits)) digits = `254${digits}`;
  return {
    ...s,
    /** Number for wa.me links (digits only). */
    whatsappDigits: digits,
    /** Human-readable, e.g. "+254 712 480 316" when it is a Kenyan number. */
    whatsappDisplay: digits.length === 12 && digits.startsWith("254") ? `+254 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}` : s.whatsappNumber,
  };
}

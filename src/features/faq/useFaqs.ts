import { useMemo } from "react";
import { paymentLabel } from "@/api/orderAdapter";
import { useSiteSettings } from "@/api/settings";
import { formatKES } from "@/lib/format";
import { buildFaqs } from "./faqContent";

/** The questions with the store's live details filled in (pickup address, payment methods, gift fee, WhatsApp). */
export function useFaqs() {
  const s = useSiteSettings();
  const whatsappUrl = `https://wa.me/${s.whatsappDigits}`;
  const items = useMemo(
    () =>
      buildFaqs({
        pickupAddress: s.pickupAddress,
        paymentLabels: s.paymentMethods.map(paymentLabel),
        giftFee: formatKES(s.giftFee),
        whatsapp: s.whatsappDisplay,
      }),
    [s.pickupAddress, s.paymentMethods, s.giftFee, s.whatsappDisplay],
  );
  return { items, whatsappUrl, whatsappDisplay: s.whatsappDisplay };
}

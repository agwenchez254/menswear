const KENYAN_MOBILE = /^(?:\+?254|0)?([17]\d{8})$/;

/**
 * Normalise a Kenyan mobile number to +254XXXXXXXXX.
 * Accepts 07xx, 01xx, 7xx, 254xxx and +254xxx, with spaces or dashes. Returns null when invalid.
 */
export const normalizePhone = (raw: string): string | null => {
  const digits = raw.replace(/[^\d+]/g, "");
  const match = digits.match(KENYAN_MOBILE);
  return match ? `+254${match[1]}` : null;
};

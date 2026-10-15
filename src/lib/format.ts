/** Format a Kenya Shilling amount, e.g. "KES 12,500". */
export const formatKES = (amount: number): string => `KES ${amount.toLocaleString("en-KE")}`;
export const formatDate = (iso: string): string => new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" });

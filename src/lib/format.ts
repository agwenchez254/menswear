/** Format a Kenya Shilling amount, e.g. "KES 12,500". */
export const formatKES = (amount: number): string => `KES ${amount.toLocaleString("en-KE")}`;

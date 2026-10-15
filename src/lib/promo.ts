const MESSAGES: Record<string, string> = {
  not_found: "That code is not valid.",
  inactive: "That code is not active.",
  not_started: "That code is not active yet.",
  expired: "That code has expired.",
  usage_limit_reached: "That code has been fully used.",
  per_customer_limit_reached: "You have already used that code.",
  min_subtotal_not_met: "Your bag is below the minimum for that code.",
  not_applicable: "That code does not apply to what is in your bag.",
  not_stackable: "That code cannot be combined with the offers already applied.",
};

/** Customer-facing text for why the server refused a promo code. */
export const promoReasonMessage = (reason: string | undefined): string => MESSAGES[reason ?? ""] ?? "That code cannot be used.";

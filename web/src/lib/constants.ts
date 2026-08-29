export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "in_production",
  "ready",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"] as const;

export const BOOKING_STATUSES = [
  "new",
  "contacted",
  "scheduled",
  "completed",
  "cancelled",
] as const;

export const REVIEW_LABEL = "Pending moderation";

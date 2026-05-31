export const APPOINTMENT_STATUSES = [
  "pending_deposit",
  "confirmed",
  "completed",
  "cancelled",
  "no_show"
] as const;

export const PAYMENT_STATUSES = ["pending", "paid", "refunded"] as const;

export const PAYMENT_PROVIDERS = ["square"] as const;

export const SQUARE_CHECKOUT_MODES = ["stub", "live"] as const;

export const NOTIFICATION_CHANNELS = ["email", "sms"] as const;

export const NOTIFICATION_STATUSES = ["queued", "sent", "failed", "skipped"] as const;

export const AVAILABILITY_BLOCK_TYPES = ["full_day", "time_range"] as const;

export const BOOKING_HOLD_STATUSES = ["active", "expired", "converted", "cancelled"] as const;

export const ADMIN_ROLES = ["owner", "manager"] as const;

export const CUSTOMER_TAGS = ["vip", "regular", "new_client", "prefers_quiet"] as const;

export const DAILY_TIMES: readonly string[] = [
  "10:00 AM",
  "11:00 AM",
  "12:30 PM",
  "2:00 PM",
  "3:30 PM",
  "5:00 PM"
] as const;

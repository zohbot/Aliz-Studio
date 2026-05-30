import type { BookingNotification } from "@/lib/domain";

export type { BookingNotification, NotificationChannel, NotificationLog, NotificationStatus } from "@/lib/domain";

export async function notifyOwnerOfBooking(notification: BookingNotification) {
  // Future integration point: Resend for email and Twilio for SMS.
  return {
    queued: true,
    channels: ["email", "sms"],
    preview: `${notification.customerName} requested ${notification.quote.serviceName}`
  };
}

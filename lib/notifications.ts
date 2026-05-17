import type { BookingQuote } from "@/lib/booking";

export type BookingNotification = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quote: BookingQuote;
};

export async function notifyOwnerOfBooking(notification: BookingNotification) {
  // Future integration point: Resend for email and Twilio for SMS.
  return {
    queued: true,
    channels: ["email", "sms"],
    preview: `${notification.customerName} requested ${notification.quote.serviceName}`
  };
}

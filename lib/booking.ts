import type { BookingQuote, BookingQuoteInput } from "@/lib/domain";
import {
  appointmentDateSchema,
  bookingQuoteSchema,
  createBookingSchema
} from "@/lib/domain";
import { getService } from "@/lib/services";

export {
  appointmentDateSchema,
  bookingQuoteSchema,
  createBookingSchema
};

export type { BookingCreateInput, BookingQuote, BookingQuoteInput, BookingRequest } from "@/lib/domain";

export function buildBookingQuote(input: BookingQuoteInput): BookingQuote {
  const service = getService(input.serviceId);

  if (!service) {
    throw new Error("Unknown service selected.");
  }

  return {
    serviceId: service.id,
    serviceName: service.name,
    appointmentDate: input.appointmentDate,
    durationMinutes: service.durationMinutes,
    price: service.price,
    deposit: service.deposit,
    amountDueAtVisit: Math.max(service.price - service.deposit, 0)
  };
}

export function buildSquareCheckoutPayload(quote: BookingQuote) {
  return {
    idempotencyKey: `aliz-${quote.serviceId}-${quote.appointmentDate}`,
    lineItems: [
      {
        name: `${quote.serviceName} deposit`,
        quantity: "1",
        basePriceMoney: {
          amount: quote.deposit * 100,
          currency: "USD"
        }
      }
    ],
    note: `Appointment deposit for ${quote.serviceName} on ${quote.appointmentDate}`
  };
}

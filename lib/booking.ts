import { z } from "zod";
import { getService } from "@/lib/services";

export const bookingQuoteSchema = z.object({
  serviceId: z.string().min(1),
  appointmentDate: z.string().min(1)
});

export const createBookingSchema = bookingQuoteSchema.extend({
  appointmentTime: z.string().min(1),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(7),
  notes: z.string().max(500).optional()
});

export type BookingQuote = {
  serviceId: string;
  serviceName: string;
  appointmentDate: string;
  durationMinutes: number;
  price: number;
  deposit: number;
  amountDueAtVisit: number;
};

export function buildBookingQuote(input: z.infer<typeof bookingQuoteSchema>): BookingQuote {
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

import { z } from "zod";
import { dailyTimes } from "@/lib/availability";
import { getService } from "@/lib/services";

function parseDateId(dateId: string) {
  const [year, month, day] = dateId.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}

function isBookableDate(dateId: string) {
  const date = parseDateId(dateId);

  if (!date) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const latest = new Date(today);
  latest.setDate(today.getDate() + 120);

  return date >= today && date <= latest;
}

export const appointmentDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(isBookableDate, "Appointment date must be within the next 120 days.");

export const bookingQuoteSchema = z.object({
  serviceId: z.string().trim().min(1),
  appointmentDate: appointmentDateSchema
});

export const createBookingSchema = bookingQuoteSchema.extend({
  appointmentTime: z.string().refine((time) => dailyTimes.includes(time), "Unsupported appointment time."),
  customerName: z.string().trim().min(2).max(80),
  customerEmail: z.string().trim().email().max(120).transform((email) => email.toLowerCase()),
  customerPhone: z.string().trim().min(7).max(30),
  notes: z.string().trim().max(500).optional()
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

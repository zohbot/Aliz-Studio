import { z } from "zod";
import {
  ADMIN_ROLES,
  APPOINTMENT_STATUSES,
  AVAILABILITY_BLOCK_TYPES,
  BOOKING_HOLD_STATUSES,
  DAILY_TIMES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
  SQUARE_CHECKOUT_MODES
} from "@/lib/domain/constants";

const dailyTimeValues: readonly string[] = DAILY_TIMES;

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

export const appointmentStatusSchema = z.enum(APPOINTMENT_STATUSES);

export const paymentStatusSchema = z.enum(PAYMENT_STATUSES);

export const paymentProviderSchema = z.enum(PAYMENT_PROVIDERS);

export const squareCheckoutModeSchema = z.enum(SQUARE_CHECKOUT_MODES);

export const notificationChannelSchema = z.enum(NOTIFICATION_CHANNELS);

export const notificationStatusSchema = z.enum(NOTIFICATION_STATUSES);

export const availabilityBlockTypeSchema = z.enum(AVAILABILITY_BLOCK_TYPES);

export const bookingHoldStatusSchema = z.enum(BOOKING_HOLD_STATUSES);

export const adminRoleSchema = z.enum(ADMIN_ROLES);

export const appointmentDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(isBookableDate, "Appointment date must be within the next 120 days.");

export const bookingQuoteSchema = z.object({
  serviceId: z.string().trim().min(1),
  appointmentDate: appointmentDateSchema
});

export const createBookingSchema = bookingQuoteSchema.extend({
  appointmentTime: z.string().refine((time) => dailyTimeValues.includes(time), "Unsupported appointment time."),
  customerName: z.string().trim().min(2).max(80),
  customerEmail: z.string().trim().email().max(120).transform((email) => email.toLowerCase()),
  customerPhone: z
    .string()
    .trim()
    .min(7)
    .max(30)
    .refine((phone) => phone.replace(/\D/g, "").length === 10, "Enter a 10-digit US phone number."),
  notes: z.string().trim().max(500).optional()
});

export const ownerAppointmentUpdateSchema = z.object({
  status: appointmentStatusSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
  ownerNotes: z.string().trim().max(800).optional()
});

export const appointmentSchema = z.object({
  id: z.string().min(8),
  serviceId: z.string().min(1),
  serviceName: z.string().min(1),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointmentTime: z.string(),
  durationMinutes: z.number().int().positive(),
  price: z.number().nonnegative(),
  deposit: z.number().nonnegative(),
  amountDueAtVisit: z.number().nonnegative(),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(7),
  customerNotes: z.string().max(500).optional(),
  ownerNotes: z.string().max(800).optional(),
  status: appointmentStatusSchema,
  paymentStatus: paymentStatusSchema,
  notificationChannels: z.array(z.string()),
  squareCheckoutUrl: z.string().max(1_024).regex(/^(\/|https?:\/\/)/).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const appointmentListSchema = z.array(appointmentSchema.strict());

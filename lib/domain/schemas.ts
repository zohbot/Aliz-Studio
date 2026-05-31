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

export const localTime24Schema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a 24-hour HH:mm time.");

export const serviceSchema = z.object({
  id: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(80),
  shortName: z.string().trim().min(1).max(28),
  price: z.number().int().min(0).max(500),
  durationMinutes: z.number().int().min(5).max(240),
  deposit: z.number().int().min(0).max(500),
  description: z.string().trim().min(1).max(180),
  detail: z.string().trim().min(1).max(500),
  image: z.string().trim().min(1).max(500),
  accent: z.string().trim().min(1).max(40),
  styleNote: z.string().trim().min(1).max(240),
  inclusions: z.array(z.string().trim().min(1).max(120)).min(1).max(8),
  category: z.enum(["haircut", "beard", "detail", "kids", "add_on"]).optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  publicVisible: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999).optional()
});

export const serviceListSchema = z.array(serviceSchema.strict());

export const ownerServiceUpdateSchema = z
  .object({
    name: z.string().trim().min(1, "Service name is required.").max(80).optional(),
    shortName: z.string().trim().min(1, "Short name is required.").max(28).optional(),
    price: z.number().int("Price must be a whole dollar amount.").min(0, "Price cannot be negative.").max(500).optional(),
    durationMinutes: z
      .number()
      .int("Duration must be a whole number of minutes.")
      .min(5, "Duration must be at least 5 minutes.")
      .max(240, "Duration must stay within a reasonable booking window.")
      .optional(),
    deposit: z
      .number()
      .int("Deposit must be a whole dollar amount.")
      .min(0, "Deposit cannot be negative.")
      .max(500)
      .optional(),
    description: z.string().trim().min(1, "Short description is required.").max(180).optional(),
    active: z.boolean().optional(),
    featured: z.boolean().optional(),
    publicVisible: z.boolean().optional(),
    sortOrder: z.number().int("Sort order must be a whole number.").min(0).max(999).optional()
  })
  .strict();

export const appointmentDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(isBookableDate, "Appointment date must be within the next 120 days.");

export const availabilityBlockedDateSchema = z.object({
  id: z.string().trim().min(1).max(80),
  date: appointmentDateSchema,
  reason: z.string().trim().max(120).optional(),
  createdAt: z.string()
});

const availabilityDaySettingsObjectSchema = z
  .object({
    weekday: z.union([
      z.literal(0),
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
      z.literal(6)
    ]),
    label: z.string().trim().min(3).max(12),
    isOpen: z.boolean(),
    startTime: localTime24Schema,
    endTime: localTime24Schema,
    breakStartTime: z.union([localTime24Schema, z.literal("")]).optional(),
    breakEndTime: z.union([localTime24Schema, z.literal("")]).optional()
  })
  .strict();

export const availabilityDaySettingsSchema = availabilityDaySettingsObjectSchema
  .superRefine((day, context) => {
    if (!day.isOpen) {
      return;
    }

    if (day.startTime >= day.endTime) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time must be after start time.",
        path: ["endTime"]
      });
    }

    const hasBreakStart = Boolean(day.breakStartTime);
    const hasBreakEnd = Boolean(day.breakEndTime);

    if (hasBreakStart !== hasBreakEnd) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Break start and end are both required.",
        path: hasBreakStart ? ["breakEndTime"] : ["breakStartTime"]
      });
      return;
    }

    if (day.breakStartTime && day.breakEndTime) {
      if (day.breakStartTime >= day.breakEndTime) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Break end must be after break start.",
          path: ["breakEndTime"]
        });
      }

      if (day.breakStartTime < day.startTime || day.breakEndTime > day.endTime) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Break must fit inside open hours.",
          path: ["breakStartTime"]
        });
      }
    }
  });

export const availabilityBookingRulesSchema = z.object({
  leadTimeMinutes: z.number().int().min(0).max(1440),
  maxAppointmentsPerSlot: z.number().int().min(1).max(4),
  maxAppointmentsPerDay: z.number().int().min(1).max(48),
  cancellationCutoffHours: z.number().int().min(0).max(168)
});

const availabilitySettingsObjectSchema = z
  .object({
    timezone: z.string().trim().min(3).max(80),
    weeklyHours: z.array(availabilityDaySettingsSchema).length(7),
    blockedDates: z.array(availabilityBlockedDateSchema.strict()).max(80),
    bookingRules: availabilityBookingRulesSchema.strict(),
    updatedAt: z.string()
  })
  .strict();

function refineAvailabilityWeekdays(settings: { weeklyHours: { weekday: number }[] }, context: z.RefinementCtx) {
    const weekdays = new Set(settings.weeklyHours.map((day) => day.weekday));

    if (weekdays.size !== 7) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Weekly hours must include each weekday exactly once.",
        path: ["weeklyHours"]
      });
    }
}

export const availabilitySettingsSchema = availabilitySettingsObjectSchema.superRefine(
  refineAvailabilityWeekdays
);

export const ownerAvailabilitySettingsUpdateSchema = availabilitySettingsObjectSchema
  .omit({
    updatedAt: true
  })
  .superRefine(refineAvailabilityWeekdays);

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

import { cloneAvailabilitySettings, DEFAULT_AVAILABILITY_SETTINGS } from "@/lib/availability-defaults";
import { dailyTimes, getPreviewSlots } from "@/lib/availability-preview";
import type {
  Appointment,
  AvailabilitySettings,
  AvailabilitySettingsUpdateInput,
  AvailabilitySlot
} from "@/lib/domain";

export { dailyTimes, getPreviewSlots };
export type { AppointmentSlot } from "@/lib/availability-preview";

const activeAppointmentStatuses = new Set(["pending_deposit", "confirmed"]);

function parseDateId(dateId: string) {
  const [year, month, day] = dateId.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}

function parseTimeToMinutes(time: string) {
  const twentyFourHourMatch = time.match(/^([01]\d|2[0-3]):([0-5]\d)$/);

  if (twentyFourHourMatch) {
    return Number(twentyFourHourMatch[1]) * 60 + Number(twentyFourHourMatch[2]);
  }

  const labelMatch = time.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);

  if (!labelMatch) {
    return null;
  }

  const hour = Number(labelMatch[1]);
  const minute = Number(labelMatch[2]);
  const meridiem = labelMatch[3].toUpperCase();
  const normalizedHour = meridiem === "PM" && hour !== 12 ? hour + 12 : meridiem === "AM" && hour === 12 ? 0 : hour;

  return normalizedHour * 60 + minute;
}

function slotDateTime(appointmentDate: string, appointmentTime: string) {
  const date = parseDateId(appointmentDate);
  const minutes = parseTimeToMinutes(appointmentTime);

  if (!date || minutes === null) {
    return null;
  }

  const candidate = new Date(date);
  candidate.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);

  return candidate;
}

function isActiveAppointment(appointment: Appointment) {
  return activeAppointmentStatuses.has(appointment.status);
}

function countActiveAppointmentsForDate(appointments: Appointment[], appointmentDate: string) {
  return appointments.filter(
    (appointment) => appointment.appointmentDate === appointmentDate && isActiveAppointment(appointment)
  ).length;
}

function countActiveAppointmentsForSlot(
  appointments: Appointment[],
  appointmentDate: string,
  appointmentTime: string
) {
  return appointments.filter(
    (appointment) =>
      appointment.appointmentDate === appointmentDate &&
      appointment.appointmentTime === appointmentTime &&
      isActiveAppointment(appointment)
  ).length;
}

function isSlotInsideDayHours(settings: AvailabilitySettings, appointmentDate: string, appointmentTime: string) {
  const date = parseDateId(appointmentDate);
  const slotMinutes = parseTimeToMinutes(appointmentTime);

  if (!date || slotMinutes === null) {
    return false;
  }

  const day = settings.weeklyHours.find((item) => item.weekday === date.getDay());

  if (!day?.isOpen) {
    return false;
  }

  const startMinutes = parseTimeToMinutes(day.startTime);
  const endMinutes = parseTimeToMinutes(day.endTime);

  if (startMinutes === null || endMinutes === null || slotMinutes < startMinutes || slotMinutes >= endMinutes) {
    return false;
  }

  if (day.breakStartTime && day.breakEndTime) {
    const breakStartMinutes = parseTimeToMinutes(day.breakStartTime);
    const breakEndMinutes = parseTimeToMinutes(day.breakEndTime);

    if (
      breakStartMinutes !== null &&
      breakEndMinutes !== null &&
      slotMinutes >= breakStartMinutes &&
      slotMinutes < breakEndMinutes
    ) {
      return false;
    }
  }

  return true;
}

function isBlockedDate(settings: AvailabilitySettings, appointmentDate: string) {
  return settings.blockedDates.some((blockedDate) => blockedDate.date === appointmentDate);
}

function isInsideLeadTime(settings: AvailabilitySettings, appointmentDate: string, appointmentTime: string) {
  if (settings.bookingRules.leadTimeMinutes <= 0) {
    return false;
  }

  const candidate = slotDateTime(appointmentDate, appointmentTime);

  if (!candidate) {
    return true;
  }

  return candidate.getTime() < Date.now() + settings.bookingRules.leadTimeMinutes * 60_000;
}

export async function getAvailabilitySettings() {
  const { getAvailabilityRepository } = await import("@/lib/repositories");

  try {
    return await getAvailabilityRepository().getAvailabilitySettings();
  } catch {
    return cloneAvailabilitySettings(DEFAULT_AVAILABILITY_SETTINGS);
  }
}

export async function updateAvailabilitySettings(input: AvailabilitySettingsUpdateInput) {
  const { getAvailabilityRepository } = await import("@/lib/repositories");

  return getAvailabilityRepository().updateAvailabilitySettings(input);
}

export async function getAvailabilitySlotsForDate(appointmentDate: string): Promise<AvailabilitySlot[]> {
  let settings: AvailabilitySettings;
  let appointments: Appointment[];

  try {
    [settings, appointments] = await Promise.all([
      getAvailabilitySettings(),
      import("@/lib/appointments").then((module) => module.listAppointments())
    ]);
  } catch {
    settings = cloneAvailabilitySettings(DEFAULT_AVAILABILITY_SETTINGS);
    appointments = [];
  }

  const activeAppointmentsForDay = countActiveAppointmentsForDate(appointments, appointmentDate);
  const dayIsBlocked = isBlockedDate(settings, appointmentDate);
  const dayIsFull = activeAppointmentsForDay >= settings.bookingRules.maxAppointmentsPerDay;

  return getPreviewSlots().map((slot) => {
    const activeAppointmentsForSlot = countActiveAppointmentsForSlot(appointments, appointmentDate, slot.value);
    const slotIsFull = activeAppointmentsForSlot >= settings.bookingRules.maxAppointmentsPerSlot;
    const isReserved =
      dayIsBlocked ||
      dayIsFull ||
      slotIsFull ||
      isInsideLeadTime(settings, appointmentDate, slot.value) ||
      !isSlotInsideDayHours(settings, appointmentDate, slot.value);

    return {
      ...slot,
      isReserved
    };
  });
}

export async function isBookingSlotAvailableForDate(appointmentDate: string, appointmentTime: string) {
  const slots = await getAvailabilitySlotsForDate(appointmentDate);
  const slot = slots.find((candidate) => candidate.value === appointmentTime);

  return Boolean(slot && !slot.isReserved);
}

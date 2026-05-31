import type { AvailabilitySettings, WeekdayId } from "@/lib/domain";

export const DEFAULT_BOOKING_TIMEZONE = "America/New_York";

export const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
] as const;

export const DEFAULT_AVAILABILITY_SETTINGS: AvailabilitySettings = {
  timezone: DEFAULT_BOOKING_TIMEZONE,
  weeklyHours: WEEKDAY_LABELS.map((label, weekday) => ({
    weekday: weekday as WeekdayId,
    label,
    isOpen: true,
    startTime: "10:00",
    endTime: "18:00",
    breakStartTime: "",
    breakEndTime: ""
  })),
  blockedDates: [],
  bookingRules: {
    leadTimeMinutes: 0,
    maxAppointmentsPerSlot: 1,
    maxAppointmentsPerDay: 24,
    cancellationCutoffHours: 24
  },
  updatedAt: "2026-05-30T00:00:00.000Z"
};

export function cloneAvailabilitySettings(settings: AvailabilitySettings): AvailabilitySettings {
  return {
    timezone: settings.timezone,
    weeklyHours: settings.weeklyHours.map((day) => ({ ...day })),
    blockedDates: settings.blockedDates.map((blockedDate) => ({ ...blockedDate })),
    bookingRules: { ...settings.bookingRules },
    updatedAt: settings.updatedAt
  };
}

export function withAvailabilityDefaults(settings: Partial<AvailabilitySettings>): AvailabilitySettings {
  const defaults = cloneAvailabilitySettings(DEFAULT_AVAILABILITY_SETTINGS);
  const weeklyHours = defaults.weeklyHours.map((defaultDay) => {
    const storedDay = settings.weeklyHours?.find((day) => day.weekday === defaultDay.weekday);

    return {
      ...defaultDay,
      ...storedDay,
      label: defaultDay.label
    };
  });

  return {
    ...defaults,
    ...settings,
    weeklyHours,
    blockedDates: settings.blockedDates ?? defaults.blockedDates,
    bookingRules: {
      ...defaults.bookingRules,
      ...settings.bookingRules
    },
    updatedAt: settings.updatedAt ?? defaults.updatedAt
  };
}

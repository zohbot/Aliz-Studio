import { DAILY_TIMES } from "@/lib/domain";
import type { AvailabilitySlot } from "@/lib/domain";

export type AppointmentSlot = AvailabilitySlot;

export const dailyTimes = DAILY_TIMES;

export function getPreviewSlots(): AvailabilitySlot[] {
  return dailyTimes.map((time) => ({
    label: time,
    value: time
  }));
}

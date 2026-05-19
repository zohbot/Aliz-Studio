export type AppointmentSlot = {
  label: string;
  value: string;
};

export const dailyTimes = ["10:00 AM", "11:00 AM", "12:30 PM", "2:00 PM", "3:30 PM", "5:00 PM"];

export function getPreviewSlots(): AppointmentSlot[] {
  return dailyTimes.map((time) => ({
    label: time,
    value: time
  }));
}

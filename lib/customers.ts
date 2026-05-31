import {
  ownerCustomerProfileUpdateSchema,
  type Appointment,
  type CustomerId,
  type CustomerProfile,
  type CustomerProfileUpdateInput,
  type CustomerRecord,
  type CustomerRecordStats
} from "@/lib/domain";
import { listAppointments } from "@/lib/appointments";
import { getCustomerProfileRepository } from "@/lib/repositories";

export { ownerCustomerProfileUpdateSchema };
export type {
  CustomerProfile,
  CustomerProfileUpdateInput,
  CustomerRecord,
  CustomerRecordStats,
  CustomerTag
} from "@/lib/domain";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function hashIdentity(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function createIdentityKey(appointment: Appointment) {
  const email = normalizeEmail(appointment.customerEmail);

  if (email) {
    return `email:${email}`;
  }

  const phone = normalizePhone(appointment.customerPhone);

  if (phone) {
    return `phone:${phone}`;
  }

  return `name:${appointment.customerName.trim().toLowerCase()}`;
}

export function createCustomerRecordId(appointment: Appointment): CustomerId {
  return `cus_${hashIdentity(createIdentityKey(appointment))}`;
}

function createEmptyProfile(customerId: CustomerId): CustomerProfile {
  return {
    id: customerId,
    tags: [],
    createdAt: "",
    updatedAt: ""
  };
}

function parseAppointmentTimestamp(appointment: Appointment) {
  const [year, month, day] = appointment.appointmentDate.split("-").map(Number);
  const timeMatch = appointment.appointmentTime.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  let hours = Number(timeMatch?.[1] ?? 0);
  const minutes = Number(timeMatch?.[2] ?? 0);
  const period = timeMatch?.[3]?.toUpperCase();

  if (period === "PM" && hours !== 12) {
    hours += 12;
  }

  if (period === "AM" && hours === 12) {
    hours = 0;
  }

  return new Date(year, month - 1, day, hours, minutes).getTime();
}

function sortAppointments(appointments: Appointment[]) {
  return [...appointments].sort((left, right) => parseAppointmentTimestamp(left) - parseAppointmentTimestamp(right));
}

function buildStats(appointments: Appointment[]): CustomerRecordStats {
  const sortedAppointments = sortAppointments(appointments);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const serviceCounts = new Map<string, number>();

  for (const appointment of appointments) {
    serviceCounts.set(appointment.serviceName, (serviceCounts.get(appointment.serviceName) ?? 0) + 1);
  }

  const mostBookedService = Array.from(serviceCounts.entries()).sort((left, right) => {
    const countDifference = right[1] - left[1];

    return countDifference || left[0].localeCompare(right[0]);
  })[0]?.[0];
  const activeUpcoming = sortedAppointments.filter(
    (appointment) =>
      ["pending_deposit", "confirmed"].includes(appointment.status) &&
      parseAppointmentTimestamp(appointment) >= now.getTime()
  );
  const pastAppointments = sortedAppointments.filter(
    (appointment) => parseAppointmentTimestamp(appointment) < now.getTime()
  );
  const latestAppointment = sortedAppointments.at(-1);
  const lastAppointment = pastAppointments.at(-1) ?? sortedAppointments.at(-1);
  const nextAppointment = activeUpcoming[0];

  return {
    totalAppointments: appointments.length,
    upcomingAppointments: activeUpcoming.length,
    completedAppointments: appointments.filter((appointment) => appointment.status === "completed").length,
    cancelledAppointments: appointments.filter((appointment) => appointment.status === "cancelled").length,
    noShowAppointments: appointments.filter((appointment) => appointment.status === "no_show").length,
    pendingDepositAppointments: appointments.filter((appointment) => appointment.status === "pending_deposit").length,
    totalProjectedValue: appointments.reduce((total, appointment) => total + appointment.price, 0),
    totalPaidDeposits: appointments.reduce((total, appointment) => {
      if (appointment.paymentStatus === "paid") {
        return total + appointment.deposit;
      }

      return total;
    }, 0),
    mostBookedService,
    lastAppointmentDate: lastAppointment?.appointmentDate,
    nextAppointmentDate: nextAppointment?.appointmentDate,
    latestStatus: latestAppointment?.status
  };
}

export function buildCustomerRecords(
  appointments: Appointment[],
  profiles: CustomerProfile[]
): CustomerRecord[] {
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const groupedAppointments = new Map<CustomerId, Appointment[]>();

  for (const appointment of appointments) {
    const customerId = createCustomerRecordId(appointment);
    const currentAppointments = groupedAppointments.get(customerId) ?? [];

    groupedAppointments.set(customerId, [...currentAppointments, appointment]);
  }

  return Array.from(groupedAppointments.entries())
    .map(([customerId, customerAppointments]) => {
      const sortedAppointments = sortAppointments(customerAppointments);
      const latestAppointment = sortedAppointments.at(-1) ?? sortedAppointments[0];
      const profile = profileMap.get(customerId) ?? createEmptyProfile(customerId);

      return {
        id: customerId,
        name: latestAppointment.customerName,
        email: latestAppointment.customerEmail,
        phone: latestAppointment.customerPhone,
        profile,
        appointments: sortedAppointments,
        stats: buildStats(sortedAppointments)
      };
    })
    .sort((left, right) => {
      const leftNext = left.stats.nextAppointmentDate ?? "9999-12-31";
      const rightNext = right.stats.nextAppointmentDate ?? "9999-12-31";
      const nextDifference = leftNext.localeCompare(rightNext);

      if (nextDifference !== 0) {
        return nextDifference;
      }

      return left.name.localeCompare(right.name);
    });
}

export async function listCustomerRecords() {
  const [appointments, profiles] = await Promise.all([
    listAppointments(),
    getCustomerProfileRepository().listCustomerProfiles()
  ]);

  return buildCustomerRecords(appointments, profiles);
}

export async function getCustomerRecordById(customerId: CustomerId) {
  const customers = await listCustomerRecords();

  return customers.find((customer) => customer.id === customerId) || null;
}

export async function updateCustomerProfile(
  customerId: CustomerId,
  patch: CustomerProfileUpdateInput
) {
  const customer = await getCustomerRecordById(customerId);

  if (!customer) {
    return null;
  }

  return getCustomerProfileRepository().updateCustomerProfile(customerId, patch);
}

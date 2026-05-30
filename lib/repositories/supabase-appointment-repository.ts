import type {
  AppointmentRepository
} from "@/lib/repositories/types";
import { AppointmentRepositoryError } from "@/lib/repositories/types";

function notImplemented(operation: string): never {
  throw new AppointmentRepositoryError(
    `Supabase appointment repository is not implemented/configured in this task. Tried to run ${operation}.`,
    {
      backend: "supabase",
      code: "not_implemented"
    }
  );
}

export function createSupabaseAppointmentRepository(): AppointmentRepository {
  // Future mapping notes:
  // - appointments: maps canonical Appointment scheduling/status fields to starts_at, ends_at, status, notes.
  // - customers: create or find contact records before inserting appointments.
  // - payments: create deposit records and Square provider references alongside appointments.
  // - booking_holds: create pending-deposit holds with expires_at in the same transaction.
  // - availability_blocks: future availability checks must read blocks before creating holds.
  // - The 0001 migration adds a GiST exclusion constraint for active appointment overlap.
  // - Production create should use a transaction/RPC for customer + appointment + hold + payment setup.
  return {
    backend: "supabase",
    listAppointments() {
      return Promise.resolve(notImplemented("listAppointments"));
    },
    getAppointmentById() {
      return Promise.resolve(notImplemented("getAppointmentById"));
    },
    createAppointment() {
      return Promise.resolve(notImplemented("createAppointment"));
    },
    getReservedTimesForDate() {
      return Promise.resolve(notImplemented("getReservedTimesForDate"));
    },
    isAppointmentSlotAvailable() {
      return Promise.resolve(notImplemented("isAppointmentSlotAvailable"));
    },
    updateAppointment() {
      return Promise.resolve(notImplemented("updateAppointment"));
    },
    updateAppointmentStatus() {
      return Promise.resolve(notImplemented("updateAppointmentStatus"));
    },
    updateAppointmentPaymentStatus() {
      return Promise.resolve(notImplemented("updateAppointmentPaymentStatus"));
    },
    setAppointmentCheckoutUrl() {
      return Promise.resolve(notImplemented("setAppointmentCheckoutUrl"));
    },
    completeAppointmentDeposit() {
      return Promise.resolve(notImplemented("completeAppointmentDeposit"));
    },
    getAppointmentStats() {
      return Promise.resolve(notImplemented("getAppointmentStats"));
    }
  };
}

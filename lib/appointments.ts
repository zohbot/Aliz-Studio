import {
  appointmentStatusSchema,
  ownerAppointmentUpdateSchema,
  paymentStatusSchema
} from "@/lib/domain";
import { getAppointmentRepository } from "@/lib/repositories";
import type { AppointmentUpdateInput, CreateAppointmentInput } from "@/lib/domain";
import type { CompleteAppointmentDepositInput } from "@/lib/repositories";

export {
  appointmentStatusSchema,
  ownerAppointmentUpdateSchema,
  paymentStatusSchema
};
export type {
  Appointment,
  AppointmentAuditEvent,
  AppointmentEvent,
  AppointmentId,
  AppointmentListFilters,
  AppointmentStatus,
  AppointmentUpdateInput,
  CreateAppointmentInput,
  PaymentStatus
} from "@/lib/domain";
export type {
  AppointmentRepository,
  AppointmentRepositoryErrorCode,
  AppointmentStats,
  CompleteAppointmentDepositInput,
  RepositoryBackend,
  RepositoryContext
} from "@/lib/repositories";

export async function listAppointments() {
  return getAppointmentRepository().listAppointments();
}

export async function getAppointmentById(appointmentId: string) {
  return getAppointmentRepository().getAppointmentById(appointmentId);
}

export async function createAppointment(input: CreateAppointmentInput) {
  return getAppointmentRepository().createAppointment(input);
}

export async function getReservedTimesForDate(appointmentDate: string) {
  return getAppointmentRepository().getReservedTimesForDate(appointmentDate);
}

export async function isAppointmentSlotAvailable(appointmentDate: string, appointmentTime: string) {
  return getAppointmentRepository().isAppointmentSlotAvailable(appointmentDate, appointmentTime);
}

export async function updateAppointment(appointmentId: string, patch: AppointmentUpdateInput) {
  return getAppointmentRepository().updateAppointment(appointmentId, patch);
}

export async function setAppointmentCheckoutUrl(appointmentId: string, squareCheckoutUrl: string) {
  return getAppointmentRepository().setAppointmentCheckoutUrl(appointmentId, squareCheckoutUrl);
}

export async function completeAppointmentDeposit(input: CompleteAppointmentDepositInput) {
  return getAppointmentRepository().completeAppointmentDeposit(input);
}

export async function getAppointmentStats() {
  return getAppointmentRepository().getAppointmentStats();
}

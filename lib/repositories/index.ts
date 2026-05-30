export {
  createAppointmentRepository,
  getAppointmentRepository,
  resolveRepositoryBackend
} from "@/lib/repositories/factory";
export { createDemoAppointmentRepository } from "@/lib/repositories/demo-appointment-repository";
export { createFileAppointmentRepository } from "@/lib/repositories/file-appointment-repository";
export { createSupabaseAppointmentRepository } from "@/lib/repositories/supabase-appointment-repository";
export * from "@/lib/repositories/types";

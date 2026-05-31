export {
  createAppointmentRepository,
  createServiceRepository,
  getAppointmentRepository,
  getServiceRepository,
  resolveRepositoryBackend
} from "@/lib/repositories/factory";
export { createDemoAppointmentRepository } from "@/lib/repositories/demo-appointment-repository";
export { createDemoServiceRepository } from "@/lib/repositories/demo-service-repository";
export { createFileAppointmentRepository } from "@/lib/repositories/file-appointment-repository";
export { createFileServiceRepository } from "@/lib/repositories/file-service-repository";
export { createSupabaseAppointmentRepository } from "@/lib/repositories/supabase-appointment-repository";
export { createSupabaseServiceRepository } from "@/lib/repositories/supabase-service-repository";
export * from "@/lib/repositories/types";

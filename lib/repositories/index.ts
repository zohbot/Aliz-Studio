export {
  createAppointmentRepository,
  createAvailabilityRepository,
  createServiceRepository,
  getAppointmentRepository,
  getAvailabilityRepository,
  getServiceRepository,
  resolveRepositoryBackend
} from "@/lib/repositories/factory";
export { createDemoAvailabilityRepository } from "@/lib/repositories/demo-availability-repository";
export { createDemoAppointmentRepository } from "@/lib/repositories/demo-appointment-repository";
export { createDemoServiceRepository } from "@/lib/repositories/demo-service-repository";
export { createFileAvailabilityRepository } from "@/lib/repositories/file-availability-repository";
export { createFileAppointmentRepository } from "@/lib/repositories/file-appointment-repository";
export { createFileServiceRepository } from "@/lib/repositories/file-service-repository";
export { createSupabaseAvailabilityRepository } from "@/lib/repositories/supabase-availability-repository";
export { createSupabaseAppointmentRepository } from "@/lib/repositories/supabase-appointment-repository";
export { createSupabaseServiceRepository } from "@/lib/repositories/supabase-service-repository";
export * from "@/lib/repositories/types";

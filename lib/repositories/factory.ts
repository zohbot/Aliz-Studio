import { createDemoAvailabilityRepository } from "@/lib/repositories/demo-availability-repository";
import { createDemoAppointmentRepository } from "@/lib/repositories/demo-appointment-repository";
import { createDemoCustomerProfileRepository } from "@/lib/repositories/demo-customer-profile-repository";
import { createDemoServiceRepository } from "@/lib/repositories/demo-service-repository";
import { createFileAvailabilityRepository } from "@/lib/repositories/file-availability-repository";
import { createFileAppointmentRepository } from "@/lib/repositories/file-appointment-repository";
import { createFileCustomerProfileRepository } from "@/lib/repositories/file-customer-profile-repository";
import { createFileServiceRepository } from "@/lib/repositories/file-service-repository";
import { createSupabaseAvailabilityRepository } from "@/lib/repositories/supabase-availability-repository";
import { createSupabaseAppointmentRepository } from "@/lib/repositories/supabase-appointment-repository";
import { createSupabaseCustomerProfileRepository } from "@/lib/repositories/supabase-customer-profile-repository";
import { createSupabaseServiceRepository } from "@/lib/repositories/supabase-service-repository";
import { AppointmentRepositoryError } from "@/lib/repositories/types";
import type {
  AppointmentRepository,
  AvailabilityRepository,
  CustomerProfileRepository,
  RepositoryBackend,
  ServiceRepository
} from "@/lib/repositories/types";

let cachedAvailabilityRepository: AvailabilityRepository | null = null;
let cachedAppointmentRepository: AppointmentRepository | null = null;
let cachedCustomerProfileRepository: CustomerProfileRepository | null = null;
let cachedServiceRepository: ServiceRepository | null = null;
let cachedAvailabilityBackend: RepositoryBackend | null = null;
let cachedBackend: RepositoryBackend | null = null;
let cachedCustomerProfileBackend: RepositoryBackend | null = null;
let cachedServiceBackend: RepositoryBackend | null = null;

const isSupabaseRepositoryImplemented = false;

export function resolveRepositoryBackend(
  value = process.env.ALIZ_DATA_BACKEND,
  env: NodeJS.ProcessEnv = process.env
): RepositoryBackend {
  if (!value) {
    return "file";
  }

  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === "supabase") {
    if (isSupabaseRepositoryImplemented && env.ALIZ_ENABLE_SUPABASE_REPOSITORY === "true") {
      return "supabase";
    }

    return "file";
  }

  if (normalizedValue === "file" || normalizedValue === "demo") {
    return normalizedValue as RepositoryBackend;
  }

  return "file";
}

export function createAppointmentRepository(backend: RepositoryBackend = resolveRepositoryBackend()) {
  switch (backend) {
    case "file":
      return createFileAppointmentRepository();
    case "demo":
      return createDemoAppointmentRepository();
    case "supabase":
      return createSupabaseAppointmentRepository();
    default:
      throw new AppointmentRepositoryError(`Unsupported repository backend "${backend}".`, {
        backend,
        code: "invalid_backend"
      });
  }
}

export function createServiceRepository(backend: RepositoryBackend = resolveRepositoryBackend()) {
  switch (backend) {
    case "file":
      return createFileServiceRepository();
    case "demo":
      return createDemoServiceRepository();
    case "supabase":
      return createSupabaseServiceRepository();
    default:
      throw new AppointmentRepositoryError(`Unsupported repository backend "${backend}".`, {
        backend,
        code: "invalid_backend"
      });
  }
}

export function createCustomerProfileRepository(backend: RepositoryBackend = resolveRepositoryBackend()) {
  switch (backend) {
    case "file":
      return createFileCustomerProfileRepository();
    case "demo":
      return createDemoCustomerProfileRepository();
    case "supabase":
      return createSupabaseCustomerProfileRepository();
    default:
      throw new AppointmentRepositoryError(`Unsupported repository backend "${backend}".`, {
        backend,
        code: "invalid_backend"
      });
  }
}

export function createAvailabilityRepository(backend: RepositoryBackend = resolveRepositoryBackend()) {
  switch (backend) {
    case "file":
      return createFileAvailabilityRepository();
    case "demo":
      return createDemoAvailabilityRepository();
    case "supabase":
      return createSupabaseAvailabilityRepository();
    default:
      throw new AppointmentRepositoryError(`Unsupported repository backend "${backend}".`, {
        backend,
        code: "invalid_backend"
      });
  }
}

export function getAppointmentRepository() {
  const backend = resolveRepositoryBackend();

  if (!cachedAppointmentRepository || cachedBackend !== backend) {
    cachedAppointmentRepository = createAppointmentRepository(backend);
    cachedBackend = backend;
  }

  return cachedAppointmentRepository;
}

export function getServiceRepository() {
  const backend = resolveRepositoryBackend();

  if (!cachedServiceRepository || cachedServiceBackend !== backend) {
    cachedServiceRepository = createServiceRepository(backend);
    cachedServiceBackend = backend;
  }

  return cachedServiceRepository;
}

export function getCustomerProfileRepository() {
  const backend = resolveRepositoryBackend();

  if (!cachedCustomerProfileRepository || cachedCustomerProfileBackend !== backend) {
    cachedCustomerProfileRepository = createCustomerProfileRepository(backend);
    cachedCustomerProfileBackend = backend;
  }

  return cachedCustomerProfileRepository;
}

export function getAvailabilityRepository() {
  const backend = resolveRepositoryBackend();

  if (!cachedAvailabilityRepository || cachedAvailabilityBackend !== backend) {
    cachedAvailabilityRepository = createAvailabilityRepository(backend);
    cachedAvailabilityBackend = backend;
  }

  return cachedAvailabilityRepository;
}

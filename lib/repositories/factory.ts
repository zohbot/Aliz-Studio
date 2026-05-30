import { createDemoAppointmentRepository } from "@/lib/repositories/demo-appointment-repository";
import { createFileAppointmentRepository } from "@/lib/repositories/file-appointment-repository";
import { createSupabaseAppointmentRepository } from "@/lib/repositories/supabase-appointment-repository";
import {
  AppointmentRepositoryError,
  REPOSITORY_BACKENDS
} from "@/lib/repositories/types";
import type { AppointmentRepository, RepositoryBackend } from "@/lib/repositories/types";

let cachedAppointmentRepository: AppointmentRepository | null = null;
let cachedBackend: RepositoryBackend | null = null;

export function resolveRepositoryBackend(value = process.env.ALIZ_DATA_BACKEND): RepositoryBackend {
  if (!value) {
    return "file";
  }

  const normalizedValue = value.trim().toLowerCase();

  if (REPOSITORY_BACKENDS.includes(normalizedValue as RepositoryBackend)) {
    return normalizedValue as RepositoryBackend;
  }

  throw new AppointmentRepositoryError(
    `Unsupported ALIZ_DATA_BACKEND value "${value}". Allowed values: file, demo, supabase.`,
    {
      code: "invalid_backend"
    }
  );
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

export function getAppointmentRepository() {
  const backend = resolveRepositoryBackend();

  if (!cachedAppointmentRepository || cachedBackend !== backend) {
    cachedAppointmentRepository = createAppointmentRepository(backend);
    cachedBackend = backend;
  }

  return cachedAppointmentRepository;
}

import { randomUUID } from "crypto";
import { copyFile, mkdir, readFile, rename, unlink, writeFile } from "fs/promises";
import path from "path";
import type { Service, ServiceUpdateInput } from "@/lib/domain";
import { serviceListSchema } from "@/lib/domain";
import { baseServices, cloneServices, sortServices, withServiceDefaults } from "@/lib/service-catalog";
import type { ServiceRepository } from "@/lib/repositories/types";
import { ServiceRepositoryError } from "@/lib/repositories/types";

export function resolveFileServiceStoragePaths(env: NodeJS.ProcessEnv = process.env) {
  const isVercelRuntime = env.VERCEL === "1" || Boolean(env.VERCEL_ENV);
  const servicesFile = isVercelRuntime
    ? "/tmp/aliz-studio-services/services.json"
    : path.join(process.cwd(), "data", "services.json");

  return {
    dataDirectory: path.dirname(servicesFile),
    servicesFile
  };
}

function normalizeServices(services: Service[]) {
  return sortServices(
    services.map((service, index) => withServiceDefaults(service, index))
  );
}

function mergeWithBaseServices(candidateServices: Service[]) {
  const candidateMap = new Map(candidateServices.map((service) => [service.id, service]));

  return normalizeServices(
    baseServices.map((baseService, index) => ({
      ...withServiceDefaults(baseService, index),
      ...(candidateMap.get(baseService.id) ?? {}),
      id: baseService.id,
      image: baseService.image,
      detail: candidateMap.get(baseService.id)?.detail ?? baseService.detail,
      styleNote: candidateMap.get(baseService.id)?.styleNote ?? baseService.styleNote,
      inclusions: candidateMap.get(baseService.id)?.inclusions ?? baseService.inclusions
    }))
  );
}

function validateService(service: Service) {
  if (service.deposit > service.price) {
    throw new ServiceRepositoryError("Deposit cannot exceed the service price.", {
      backend: "file",
      code: "invalid_service"
    });
  }

  if (service.durationMinutes <= 0) {
    throw new ServiceRepositoryError("Duration must be greater than zero.", {
      backend: "file",
      code: "invalid_service"
    });
  }
}

function buildUpdatedService(currentService: Service, patch: ServiceUpdateInput) {
  const updatedService: Service = {
    ...currentService,
    ...patch,
    id: currentService.id,
    detail: currentService.detail,
    image: currentService.image,
    accent: currentService.accent,
    styleNote: currentService.styleNote,
    inclusions: currentService.inclusions
  };

  validateService(updatedService);

  return updatedService;
}

export function createFileServiceRepository(): ServiceRepository {
  let serviceMutationQueue = Promise.resolve();
  const storagePaths = resolveFileServiceStoragePaths();

  function runServiceMutation<T>(operation: () => Promise<T>) {
    const result = serviceMutationQueue.then(operation, operation);

    serviceMutationQueue = result.then(
      () => undefined,
      () => undefined
    );

    return result;
  }

  async function writeServices(services: Service[]) {
    const data = `${JSON.stringify(normalizeServices(services), null, 2)}\n`;
    const temporaryFile = `${storagePaths.servicesFile}.${randomUUID()}.tmp`;
    await mkdir(storagePaths.dataDirectory, { recursive: true });
    await writeFile(temporaryFile, data, "utf8");

    let attempts = 0;
    const maxAttempts = 4;

    while (attempts < maxAttempts) {
      attempts += 1;
      try {
        await rename(temporaryFile, storagePaths.servicesFile);
        return;
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;

        if (code === "EPERM" || code === "EACCES") {
          await new Promise((resolve) => setTimeout(resolve, attempts * 50));
          continue;
        }

        break;
      }
    }

    try {
      await copyFile(temporaryFile, storagePaths.servicesFile);
    } finally {
      await unlink(temporaryFile).catch(() => {});
    }
  }

  async function ensureServicesFile() {
    await mkdir(storagePaths.dataDirectory, { recursive: true });

    try {
      await readFile(storagePaths.servicesFile, "utf8");
    } catch {
      await writeServices(cloneServices(baseServices));
    }
  }

  async function listServices() {
    await ensureServicesFile();

    const raw = await readFile(storagePaths.servicesFile, "utf8");
    const candidate = JSON.parse(raw);
    const parsed = serviceListSchema.safeParse(candidate);

    if (!parsed.success) {
      const seedServices = cloneServices(baseServices);
      await writeServices(seedServices);

      return seedServices;
    }

    const mergedServices = mergeWithBaseServices(parsed.data);

    if (JSON.stringify(mergedServices) !== JSON.stringify(parsed.data)) {
      await writeServices(mergedServices);
    }

    return mergedServices;
  }

  async function getServiceById(serviceId: string) {
    const services = await listServices();

    return services.find((service) => service.id === serviceId) || null;
  }

  async function updateService(serviceId: string, patch: ServiceUpdateInput) {
    return runServiceMutation(async () => {
      const services = await listServices();
      const index = services.findIndex((service) => service.id === serviceId);

      if (index === -1) {
        return null;
      }

      const updatedService = buildUpdatedService(services[index], patch);
      const nextServices = services.map((service, serviceIndex) =>
        serviceIndex === index ? updatedService : service
      );

      await writeServices(nextServices);

      return updatedService;
    });
  }

  return {
    backend: "file",
    getServiceById,
    listServices,
    updateService
  };
}

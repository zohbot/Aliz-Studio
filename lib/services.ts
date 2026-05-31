import type { Service, ServiceUpdateInput } from "@/lib/domain";
import { baseServices, cloneServices, sortServices } from "@/lib/service-catalog";
export { formatMoney } from "@/lib/format";

export type {
  Service,
  ServiceCategory,
  ServiceDurationMinutes,
  ServiceId,
  ServiceUpdateInput
} from "@/lib/domain";

// Compatibility export for components that still need a static, build-safe catalog.
export const services: Service[] = cloneServices(baseServices);

export function getService(serviceId: string) {
  return services.find((service) => service.id === serviceId);
}

async function getRepository() {
  const { getServiceRepository } = await import("@/lib/repositories/factory");

  return getServiceRepository();
}

export async function listServices() {
  return (await getRepository()).listServices();
}

export async function listPublicServices() {
  const currentServices = await listServices();

  return sortServices(
    currentServices.filter((service) => service.publicVisible !== false)
  );
}

export async function listBookableServices() {
  const currentServices = await listServices();

  return sortServices(
    currentServices.filter((service) => service.publicVisible !== false && service.active !== false)
  );
}

export async function getEditableService(serviceId: string) {
  return (await getRepository()).getServiceById(serviceId);
}

export async function getPublicService(serviceId: string) {
  const service = await getEditableService(serviceId);

  if (!service || service.publicVisible === false) {
    return null;
  }

  return service;
}

export async function getBookableService(serviceId: string) {
  const service = await getEditableService(serviceId);

  if (!service || service.publicVisible === false || service.active === false) {
    return null;
  }

  return service;
}

export async function updateService(serviceId: string, patch: ServiceUpdateInput) {
  return (await getRepository()).updateService(serviceId, patch);
}

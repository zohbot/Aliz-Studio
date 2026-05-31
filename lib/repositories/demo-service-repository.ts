import type { Service, ServiceUpdateInput } from "@/lib/domain";
import { demoServices } from "@/lib/demo";
import { cloneServices, sortServices } from "@/lib/service-catalog";
import type { ServiceRepository } from "@/lib/repositories/types";
import { ServiceRepositoryError } from "@/lib/repositories/types";

function validateService(service: Service) {
  if (service.deposit > service.price) {
    throw new ServiceRepositoryError("Deposit cannot exceed the service price.", {
      backend: "demo",
      code: "invalid_service"
    });
  }
}

export function createDemoServiceRepository(): ServiceRepository {
  let services = cloneServices(demoServices);

  return {
    backend: "demo",
    async listServices() {
      return cloneServices(sortServices(services));
    },
    async getServiceById(serviceId: string) {
      return cloneServices(services).find((service) => service.id === serviceId) || null;
    },
    async updateService(serviceId: string, patch: ServiceUpdateInput) {
      const index = services.findIndex((service) => service.id === serviceId);

      if (index === -1) {
        return null;
      }

      const updatedService: Service = {
        ...services[index],
        ...patch,
        id: services[index].id,
        detail: services[index].detail,
        image: services[index].image,
        accent: services[index].accent,
        styleNote: services[index].styleNote,
        inclusions: services[index].inclusions
      };

      validateService(updatedService);
      services = services.map((service, serviceIndex) =>
        serviceIndex === index ? updatedService : service
      );

      return { ...updatedService, inclusions: [...updatedService.inclusions] };
    }
  };
}

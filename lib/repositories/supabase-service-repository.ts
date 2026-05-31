import type { ServiceRepository } from "@/lib/repositories/types";
import { ServiceRepositoryError } from "@/lib/repositories/types";

function notImplemented(): never {
  throw new ServiceRepositoryError(
    "Supabase service repository is not implemented or configured in this demo-safe sprint.",
    {
      backend: "supabase",
      code: "not_implemented"
    }
  );
}

export function createSupabaseServiceRepository(): ServiceRepository {
  return {
    backend: "supabase",
    listServices() {
      return notImplemented();
    },
    getServiceById() {
      return notImplemented();
    },
    updateService() {
      return notImplemented();
    }
  };
}

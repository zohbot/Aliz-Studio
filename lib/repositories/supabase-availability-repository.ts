import { AvailabilityRepositoryError } from "@/lib/repositories/types";
import type { AvailabilityRepository } from "@/lib/repositories/types";

export function createSupabaseAvailabilityRepository(): AvailabilityRepository {
  function unavailable(): never {
    throw new AvailabilityRepositoryError(
      "Supabase availability repository is not implemented or configured in this task.",
      {
        backend: "supabase",
        code: "not_implemented"
      }
    );
  }

  return {
    backend: "supabase",
    getAvailabilitySettings() {
      unavailable();
    },
    updateAvailabilitySettings() {
      unavailable();
    }
  };
}

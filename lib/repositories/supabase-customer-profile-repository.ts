import {
  CustomerProfileRepositoryError,
  type CustomerProfileRepository,
} from "@/lib/repositories/types";

function createNotImplementedError() {
  return new CustomerProfileRepositoryError(
    "Supabase customer profile repository is not implemented or configured in this task.",
    {
      backend: "supabase",
      code: "not_implemented"
    }
  );
}

export function createSupabaseCustomerProfileRepository(): CustomerProfileRepository {
  return {
    backend: "supabase",
    async listCustomerProfiles() {
      throw createNotImplementedError();
    },
    async getCustomerProfile() {
      throw createNotImplementedError();
    },
    async updateCustomerProfile() {
      throw createNotImplementedError();
    }
  };
}

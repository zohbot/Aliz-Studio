import type { CustomerId, CustomerProfile } from "@/lib/domain";
import type {
  CustomerProfileRepository,
  UpdateCustomerProfileRepositoryInput
} from "@/lib/repositories/types";

const DEMO_PROFILE_TIMESTAMP = "2030-06-15T15:00:00.000Z";

function cloneProfile(profile: CustomerProfile): CustomerProfile {
  return {
    ...profile,
    tags: [...profile.tags]
  };
}

function cleanText(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed || undefined;
}

export function createDemoCustomerProfileRepository(): CustomerProfileRepository {
  let customerProfileMutationQueue = Promise.resolve();
  let profiles: CustomerProfile[] = [];

  function runCustomerProfileMutation<T>(operation: () => Promise<T>) {
    const result = customerProfileMutationQueue.then(operation, operation);

    customerProfileMutationQueue = result.then(
      () => undefined,
      () => undefined
    );

    return result;
  }

  async function listCustomerProfiles() {
    return profiles.map((profile) => cloneProfile(profile));
  }

  async function getCustomerProfile(customerId: CustomerId) {
    const profile = profiles.find((item) => item.id === customerId);

    return profile ? cloneProfile(profile) : null;
  }

  async function updateCustomerProfile(
    customerId: CustomerId,
    patch: UpdateCustomerProfileRepositoryInput
  ) {
    return runCustomerProfileMutation(async () => {
      const existingProfile = profiles.find((profile) => profile.id === customerId);
      const nextProfile: CustomerProfile = {
        id: customerId,
        ownerNotes: patch.ownerNotes === undefined ? existingProfile?.ownerNotes : cleanText(patch.ownerNotes),
        sensitiveNote:
          patch.sensitiveNote === undefined ? existingProfile?.sensitiveNote : cleanText(patch.sensitiveNote),
        preferredCut:
          patch.preferredCut === undefined ? existingProfile?.preferredCut : cleanText(patch.preferredCut),
        preferredTimeWindow:
          patch.preferredTimeWindow === undefined
            ? existingProfile?.preferredTimeWindow
            : cleanText(patch.preferredTimeWindow),
        tags: patch.tags === undefined ? existingProfile?.tags ?? [] : [...new Set(patch.tags)],
        createdAt: existingProfile?.createdAt ?? DEMO_PROFILE_TIMESTAMP,
        updatedAt: DEMO_PROFILE_TIMESTAMP
      };

      profiles = existingProfile
        ? profiles.map((profile) => (profile.id === customerId ? nextProfile : profile))
        : [...profiles, nextProfile];

      return cloneProfile(nextProfile);
    });
  }

  return {
    backend: "demo",
    listCustomerProfiles,
    getCustomerProfile,
    updateCustomerProfile
  };
}

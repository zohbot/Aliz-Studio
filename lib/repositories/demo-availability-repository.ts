import {
  cloneAvailabilitySettings,
  DEFAULT_AVAILABILITY_SETTINGS,
  withAvailabilityDefaults
} from "@/lib/availability-defaults";
import { ownerAvailabilitySettingsUpdateSchema } from "@/lib/domain";
import type { AvailabilitySettings } from "@/lib/domain";
import type {
  AvailabilityRepository,
  UpdateAvailabilitySettingsRepositoryInput
} from "@/lib/repositories/types";
import { AvailabilityRepositoryError } from "@/lib/repositories/types";

const DEMO_AVAILABILITY_UPDATED_AT = "2030-06-15T15:00:00.000Z";

export function createDemoAvailabilityRepository(): AvailabilityRepository {
  let settings: AvailabilitySettings = withAvailabilityDefaults({
    ...DEFAULT_AVAILABILITY_SETTINGS,
    updatedAt: DEMO_AVAILABILITY_UPDATED_AT
  });

  async function getAvailabilitySettings() {
    return cloneAvailabilitySettings(settings);
  }

  async function updateAvailabilitySettings(input: UpdateAvailabilitySettingsRepositoryInput) {
    const parsed = ownerAvailabilitySettingsUpdateSchema.safeParse(input);

    if (!parsed.success) {
      throw new AvailabilityRepositoryError("Invalid availability settings.", {
        backend: "demo",
        code: "invalid_settings"
      });
    }

    settings = withAvailabilityDefaults({
      ...parsed.data,
      updatedAt: DEMO_AVAILABILITY_UPDATED_AT
    });

    return cloneAvailabilitySettings(settings);
  }

  return {
    backend: "demo",
    getAvailabilitySettings,
    updateAvailabilitySettings
  };
}

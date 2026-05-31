import { randomUUID } from "crypto";
import { copyFile, mkdir, readFile, rename, unlink, writeFile } from "fs/promises";
import path from "path";
import {
  cloneAvailabilitySettings,
  DEFAULT_AVAILABILITY_SETTINGS,
  withAvailabilityDefaults
} from "@/lib/availability-defaults";
import { availabilitySettingsSchema, ownerAvailabilitySettingsUpdateSchema } from "@/lib/domain";
import type { AvailabilitySettings } from "@/lib/domain";
import type {
  AvailabilityRepository,
  UpdateAvailabilitySettingsRepositoryInput
} from "@/lib/repositories/types";
import { AvailabilityRepositoryError } from "@/lib/repositories/types";

export function resolveFileAvailabilityStoragePaths(env: NodeJS.ProcessEnv = process.env) {
  const isVercelRuntime = env.VERCEL === "1" || Boolean(env.VERCEL_ENV);
  const availabilityFile = isVercelRuntime
    ? "/tmp/aliz-studio-availability/settings.json"
    : path.join(process.cwd(), "data", "availability-settings.json");

  return {
    availabilityFile,
    dataDirectory: path.dirname(availabilityFile)
  };
}

export function createFileAvailabilityRepository(): AvailabilityRepository {
  let availabilityMutationQueue = Promise.resolve();
  const storagePaths = resolveFileAvailabilityStoragePaths();

  function runAvailabilityMutation<T>(operation: () => Promise<T>) {
    const result = availabilityMutationQueue.then(operation, operation);

    availabilityMutationQueue = result.then(
      () => undefined,
      () => undefined
    );

    return result;
  }

  async function writeAvailabilitySettings(settings: AvailabilitySettings) {
    const data = `${JSON.stringify(settings, null, 2)}\n`;
    const temporaryFile = `${storagePaths.availabilityFile}.${randomUUID()}.tmp`;
    await mkdir(storagePaths.dataDirectory, { recursive: true });
    await writeFile(temporaryFile, data, "utf8");

    let attempts = 0;
    const maxAttempts = 4;

    while (attempts < maxAttempts) {
      attempts += 1;
      try {
        await rename(temporaryFile, storagePaths.availabilityFile);
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
      await copyFile(temporaryFile, storagePaths.availabilityFile);
    } finally {
      await unlink(temporaryFile).catch(() => {});
    }
  }

  async function ensureAvailabilitySettingsFile() {
    await mkdir(storagePaths.dataDirectory, { recursive: true });

    try {
      await readFile(storagePaths.availabilityFile, "utf8");
    } catch {
      await writeAvailabilitySettings(DEFAULT_AVAILABILITY_SETTINGS);
    }
  }

  async function getAvailabilitySettings() {
    await ensureAvailabilitySettingsFile();

    const raw = await readFile(storagePaths.availabilityFile, "utf8");

    try {
      const candidate = withAvailabilityDefaults(JSON.parse(raw));
      const parsed = availabilitySettingsSchema.safeParse(candidate);

      if (parsed.success) {
        return cloneAvailabilitySettings(parsed.data);
      }
    } catch {
      // Invalid JSON is reset below to keep the owner page and public booking flow available.
    }

    await writeAvailabilitySettings(DEFAULT_AVAILABILITY_SETTINGS);

    return cloneAvailabilitySettings(DEFAULT_AVAILABILITY_SETTINGS);
  }

  async function updateAvailabilitySettings(input: UpdateAvailabilitySettingsRepositoryInput) {
    return runAvailabilityMutation(async () => {
      const candidate = withAvailabilityDefaults({
        ...input,
        updatedAt: new Date().toISOString()
      });
      const parsedInput = ownerAvailabilitySettingsUpdateSchema.safeParse(input);
      const parsedSettings = availabilitySettingsSchema.safeParse(candidate);

      if (!parsedInput.success || !parsedSettings.success) {
        throw new AvailabilityRepositoryError("Invalid availability settings.", {
          backend: "file",
          code: "invalid_settings"
        });
      }

      await writeAvailabilitySettings(parsedSettings.data);

      return cloneAvailabilitySettings(parsedSettings.data);
    });
  }

  return {
    backend: "file",
    getAvailabilitySettings,
    updateAvailabilitySettings
  };
}

import { randomUUID } from "crypto";
import { copyFile, mkdir, readFile, rename, unlink, writeFile } from "fs/promises";
import path from "path";
import type { CustomerId, CustomerProfile } from "@/lib/domain";
import { customerProfileListSchema, customerProfileSchema } from "@/lib/domain";
import {
  CustomerProfileRepositoryError,
  type CustomerProfileRepository,
  type UpdateCustomerProfileRepositoryInput
} from "@/lib/repositories/types";

export function resolveFileCustomerProfileStoragePaths(env: NodeJS.ProcessEnv = process.env) {
  const isVercelRuntime = env.VERCEL === "1" || Boolean(env.VERCEL_ENV);
  const customerProfilesFile = isVercelRuntime
    ? "/tmp/aliz-studio-customers/profiles.json"
    : path.join(process.cwd(), "data", "customer-profiles.json");

  return {
    customerProfilesFile,
    dataDirectory: path.dirname(customerProfilesFile)
  };
}

function cleanText(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed || undefined;
}

function normalizePatch(patch: UpdateCustomerProfileRepositoryInput) {
  return {
    ownerNotes: cleanText(patch.ownerNotes),
    sensitiveNote: cleanText(patch.sensitiveNote),
    preferredCut: cleanText(patch.preferredCut),
    preferredTimeWindow: cleanText(patch.preferredTimeWindow),
    tags: [...new Set(patch.tags ?? [])]
  };
}

export function createFileCustomerProfileRepository(): CustomerProfileRepository {
  let customerProfileMutationQueue = Promise.resolve();
  const storagePaths = resolveFileCustomerProfileStoragePaths();

  function runCustomerProfileMutation<T>(operation: () => Promise<T>) {
    const result = customerProfileMutationQueue.then(operation, operation);

    customerProfileMutationQueue = result.then(
      () => undefined,
      () => undefined
    );

    return result;
  }

  async function writeCustomerProfiles(profiles: CustomerProfile[]) {
    const data = `${JSON.stringify(profiles, null, 2)}\n`;
    const temporaryFile = `${storagePaths.customerProfilesFile}.${randomUUID()}.tmp`;
    await mkdir(storagePaths.dataDirectory, { recursive: true });
    await writeFile(temporaryFile, data, "utf8");

    let attempts = 0;
    const maxAttempts = 4;

    while (attempts < maxAttempts) {
      attempts += 1;
      try {
        await rename(temporaryFile, storagePaths.customerProfilesFile);
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
      await copyFile(temporaryFile, storagePaths.customerProfilesFile);
    } finally {
      await unlink(temporaryFile).catch(() => {});
    }
  }

  async function ensureCustomerProfilesFile() {
    await mkdir(storagePaths.dataDirectory, { recursive: true });

    try {
      await readFile(storagePaths.customerProfilesFile, "utf8");
    } catch {
      await writeCustomerProfiles([]);
    }
  }

  async function listCustomerProfiles() {
    await ensureCustomerProfilesFile();

    const raw = await readFile(storagePaths.customerProfilesFile, "utf8");
    const candidate = JSON.parse(raw);
    const parsed = customerProfileListSchema.safeParse(candidate);

    if (!parsed.success) {
      await writeCustomerProfiles([]);

      return [];
    }

    return parsed.data;
  }

  async function getCustomerProfile(customerId: CustomerId) {
    const profiles = await listCustomerProfiles();

    return profiles.find((profile) => profile.id === customerId) || null;
  }

  async function updateCustomerProfile(
    customerId: CustomerId,
    patch: UpdateCustomerProfileRepositoryInput
  ) {
    return runCustomerProfileMutation(async () => {
      const profiles = await listCustomerProfiles();
      const existingProfile = profiles.find((profile) => profile.id === customerId);
      const now = new Date().toISOString();
      const normalizedPatch = normalizePatch(patch);
      const nextProfile: CustomerProfile = {
        id: customerId,
        ownerNotes: patch.ownerNotes === undefined ? existingProfile?.ownerNotes : normalizedPatch.ownerNotes,
        sensitiveNote:
          patch.sensitiveNote === undefined ? existingProfile?.sensitiveNote : normalizedPatch.sensitiveNote,
        preferredCut:
          patch.preferredCut === undefined ? existingProfile?.preferredCut : normalizedPatch.preferredCut,
        preferredTimeWindow:
          patch.preferredTimeWindow === undefined
            ? existingProfile?.preferredTimeWindow
            : normalizedPatch.preferredTimeWindow,
        tags: patch.tags === undefined ? existingProfile?.tags ?? [] : normalizedPatch.tags,
        createdAt: existingProfile?.createdAt ?? now,
        updatedAt: now
      };
      const parsed = customerProfileSchema.safeParse(nextProfile);

      if (!parsed.success) {
        throw new CustomerProfileRepositoryError("Customer profile failed validation.", {
          backend: "file",
          code: "invalid_profile"
        });
      }

      const nextProfiles = existingProfile
        ? profiles.map((profile) => (profile.id === customerId ? parsed.data : profile))
        : [...profiles, parsed.data];

      await writeCustomerProfiles(nextProfiles);

      return parsed.data;
    });
  }

  return {
    backend: "file",
    listCustomerProfiles,
    getCustomerProfile,
    updateCustomerProfile
  };
}

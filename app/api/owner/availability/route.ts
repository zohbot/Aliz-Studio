import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getOwnerSession } from "@/lib/admin-auth";
import { assertSameOriginRequest, parseJsonRequest } from "@/lib/api-security";
import { getAvailabilitySettings, updateAvailabilitySettings } from "@/lib/availability";
import { ownerAvailabilitySettingsUpdateSchema } from "@/lib/domain";
import { AvailabilityRepositoryError } from "@/lib/repositories";

export const runtime = "nodejs";

export async function GET() {
  const session = await getOwnerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    return NextResponse.json({
      settings: await getAvailabilitySettings()
    });
  } catch {
    return NextResponse.json(
      {
        error: "Availability settings are temporarily unavailable."
      },
      { status: 503 }
    );
  }
}

export async function PATCH(request: Request) {
  const originError = assertSameOriginRequest(request);

  if (originError) {
    return originError;
  }

  const session = await getOwnerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const json = await parseJsonRequest(request, 20_000);

  if (!json.ok) {
    return json.response;
  }

  const parsed = ownerAvailabilitySettingsUpdateSchema.safeParse(json.data);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid availability settings.",
        issues: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  try {
    const settings = await updateAvailabilitySettings(parsed.data);

    revalidatePath("/book");
    revalidatePath("/owner/availability");
    revalidatePath("/owner/dashboard");

    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof AvailabilityRepositoryError && error.code === "invalid_settings") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: "Availability settings are temporarily unavailable."
      },
      { status: 503 }
    );
  }
}

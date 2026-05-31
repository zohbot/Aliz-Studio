import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getOwnerSession } from "@/lib/admin-auth";
import { assertSameOriginRequest, parseJsonRequest } from "@/lib/api-security";
import { ownerServiceUpdateSchema } from "@/lib/domain";
import { getEditableService, updateService } from "@/lib/services";
import { ServiceRepositoryError } from "@/lib/repositories";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    serviceId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const originError = assertSameOriginRequest(request);

  if (originError) {
    return originError;
  }

  const session = await getOwnerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const json = await parseJsonRequest(request);

  if (!json.ok) {
    return json.response;
  }

  const parsed = ownerServiceUpdateSchema.safeParse(json.data);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid service update.",
        issues: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const { serviceId } = await context.params;
  const currentService = await getEditableService(serviceId);

  if (!currentService) {
    return NextResponse.json({ error: "Service not found." }, { status: 404 });
  }

  const mergedService = {
    ...currentService,
    ...parsed.data
  };

  if (mergedService.deposit > mergedService.price) {
    return NextResponse.json(
      {
        error: "Deposit cannot exceed the service price."
      },
      { status: 400 }
    );
  }

  try {
    const service = await updateService(serviceId, parsed.data);

    if (!service) {
      return NextResponse.json({ error: "Service not found." }, { status: 404 });
    }

    revalidatePath("/");
    revalidatePath("/book");
    revalidatePath("/packages");
    revalidatePath("/owner/dashboard");
    revalidatePath("/owner/services");
    revalidatePath(`/services/${service.id}`);

    return NextResponse.json({ service });
  } catch (error) {
    if (error instanceof ServiceRepositoryError && error.code === "invalid_service") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: "Service storage is temporarily unavailable."
      },
      { status: 503 }
    );
  }
}

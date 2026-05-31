import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getOwnerSession } from "@/lib/admin-auth";
import { assertSameOriginRequest, parseJsonRequest } from "@/lib/api-security";
import { ownerCustomerProfileUpdateSchema, updateCustomerProfile } from "@/lib/customers";
import { CustomerProfileRepositoryError } from "@/lib/repositories";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    customerId: string;
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

  const json = await parseJsonRequest(request, 5_000);

  if (!json.ok) {
    return json.response;
  }

  const parsed = ownerCustomerProfileUpdateSchema.safeParse(json.data);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid customer profile update.",
        issues: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const { customerId } = await context.params;

  try {
    const profile = await updateCustomerProfile(customerId, parsed.data);

    if (!profile) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    revalidatePath("/owner/customers");
    revalidatePath("/owner/dashboard");

    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof CustomerProfileRepositoryError && error.code === "invalid_profile") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: "Customer profile storage is temporarily unavailable."
      },
      { status: 503 }
    );
  }
}

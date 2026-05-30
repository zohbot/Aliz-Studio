import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getOwnerSession } from "@/lib/admin-auth";
import { assertSameOriginRequest, parseJsonRequest } from "@/lib/api-security";
import { updateAppointment } from "@/lib/appointments";
import { ownerAppointmentUpdateSchema } from "@/lib/domain";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    appointmentId: string;
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

  const parsed = ownerAppointmentUpdateSchema.safeParse(json.data);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid appointment update.",
        issues: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const { appointmentId } = await context.params;
  let appointment;

  try {
    appointment = await updateAppointment(appointmentId, parsed.data);
  } catch {
    return NextResponse.json(
      {
        error: "Appointment storage is temporarily unavailable."
      },
      { status: 503 }
    );
  }

  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  }

  revalidatePath("/owner/dashboard");

  return NextResponse.json({ appointment });
}

import { NextResponse } from "next/server";
import { getOwnerSession } from "@/lib/admin-auth";
import { assertSameOriginRequest, parseJsonRequest } from "@/lib/api-security";
import { ownerAppointmentUpdateSchema, updateAppointment } from "@/lib/appointments";

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
  const appointment = await updateAppointment(appointmentId, parsed.data);

  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  }

  return NextResponse.json({ appointment });
}

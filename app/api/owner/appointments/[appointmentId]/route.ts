import { NextResponse } from "next/server";
import { getOwnerSession } from "@/lib/admin-auth";
import { ownerAppointmentUpdateSchema, updateAppointment } from "@/lib/appointments";

type RouteContext = {
  params: Promise<{
    appointmentId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getOwnerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const parsed = ownerAppointmentUpdateSchema.safeParse(await request.json());

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

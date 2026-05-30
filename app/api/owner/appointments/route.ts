import { NextResponse } from "next/server";
import { getOwnerSession } from "@/lib/admin-auth";
import { listAppointments } from "@/lib/appointments";

export const runtime = "nodejs";

export async function GET() {
  const session = await getOwnerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    return NextResponse.json({
      appointments: await listAppointments()
    });
  } catch {
    return NextResponse.json(
      {
        error: "Appointment storage is temporarily unavailable."
      },
      { status: 503 }
    );
  }
}

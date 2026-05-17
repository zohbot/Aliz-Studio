import { NextResponse } from "next/server";
import { getOwnerSession } from "@/lib/admin-auth";
import { listAppointments } from "@/lib/appointments";

export async function GET() {
  const session = await getOwnerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({
    appointments: await listAppointments()
  });
}

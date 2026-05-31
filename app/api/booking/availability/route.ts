import { NextResponse } from "next/server";
import { z } from "zod";
import { getAvailabilitySlotsForDate } from "@/lib/availability";
import { appointmentDateSchema } from "@/lib/domain";

export const runtime = "nodejs";

const availabilitySchema = z.object({
  date: appointmentDateSchema
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = availabilitySchema.safeParse({
    date: searchParams.get("date")
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "A valid appointment date is required."
      },
      { status: 400 }
    );
  }

  let slots;

  try {
    slots = await getAvailabilitySlotsForDate(parsed.data.date);
  } catch {
    return NextResponse.json(
      {
        error: "Availability is temporarily unavailable."
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    date: parsed.data.date,
    slots
  });
}

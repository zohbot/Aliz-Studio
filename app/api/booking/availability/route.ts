import { NextResponse } from "next/server";
import { z } from "zod";
import { getReservedTimesForDate } from "@/lib/appointments";
import { getPreviewSlots } from "@/lib/availability";

const availabilitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
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

  const reservedTimes = await getReservedTimesForDate(parsed.data.date);
  const slots = getPreviewSlots().map((slot) => ({
    ...slot,
    isReserved: reservedTimes.includes(slot.value)
  }));

  return NextResponse.json({
    date: parsed.data.date,
    slots
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonRequest } from "@/lib/api-security";
import { completeAppointmentDeposit } from "@/lib/appointments";

const completeCheckoutSchema = z.object({
  appointmentId: z.string().min(1),
  cardholderName: z.string().min(2).max(80),
  cardLastFour: z.string().regex(/^\d{4}$/)
});

export async function POST(request: Request) {
  const json = await parseJsonRequest(request);

  if (!json.ok) {
    return json.response;
  }

  const parsed = completeCheckoutSchema.safeParse(json.data);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid checkout request.",
        issues: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  let appointment;

  try {
    appointment = await completeAppointmentDeposit(parsed.data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Checkout could not be completed."
      },
      { status: 409 }
    );
  }

  if (!appointment) {
    return NextResponse.json(
      {
        error: "Appointment could not be found."
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    status: "confirmed",
    appointment,
    receipt: {
      id: `mock_rcpt_${appointment.id.slice(-8)}`,
      amountPaid: appointment.deposit,
      cardLastFour: parsed.data.cardLastFour,
      provider: "square_mock"
    }
  });
}

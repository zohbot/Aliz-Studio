import { NextResponse } from "next/server";
import { parseJsonRequest } from "@/lib/api-security";
import { createAppointment, setAppointmentCheckoutUrl } from "@/lib/appointments";
import { isBookingSlotAvailableForDate } from "@/lib/availability";
import { buildBookingQuote, createBookingSchema } from "@/lib/booking";
import { notifyOwnerOfBooking } from "@/lib/notifications";
import { createSquareDepositCheckout } from "@/lib/square";
import { consumeRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const json = await parseJsonRequest(request);

  if (!json.ok) {
    return json.response;
  }

  const parsed = createBookingSchema.safeParse(json.data);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid booking request.",
        issues: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  let quote;

  try {
    quote = await buildBookingQuote(parsed.data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to build booking quote."
      },
      { status: 404 }
    );
  }

  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const bookingKey = `booking-create:${ipAddress}`;
  const rateLimit = consumeRateLimit(bookingKey, 10, 60 * 1000);

  if (!rateLimit.allowed) {
    const response = NextResponse.json(
      { error: "Too many booking requests. Please wait a moment and try again." },
      { status: 429 }
    );

    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
    return response;
  }

  const isAvailable = await isBookingSlotAvailableForDate(parsed.data.appointmentDate, parsed.data.appointmentTime);

  if (!isAvailable) {
    return NextResponse.json(
      {
        error: "That appointment time is not currently available. Please choose another slot."
      },
      { status: 409 }
    );
  }

  const checkout = await createSquareDepositCheckout(quote);
  let appointment;

  try {
    appointment = await createAppointment({
      quote,
      appointmentTime: parsed.data.appointmentTime,
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      customerPhone: parsed.data.customerPhone,
      customerNotes: parsed.data.notes,
      squareCheckoutUrl: checkout.checkoutUrl
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to reserve appointment time."
      },
      { status: 409 }
    );
  }

  const checkoutUrl = new URL(checkout.checkoutUrl, request.url);
  checkoutUrl.searchParams.set("appointment", appointment.id);
  checkoutUrl.searchParams.set("date", appointment.appointmentDate);
  checkoutUrl.searchParams.set("time", appointment.appointmentTime);
  checkout.checkoutUrl = `${checkoutUrl.pathname}${checkoutUrl.search}`;
  appointment = (await setAppointmentCheckoutUrl(appointment.id, checkout.checkoutUrl)) || appointment;
  const notification = await notifyOwnerOfBooking({
    customerName: parsed.data.customerName,
    customerEmail: parsed.data.customerEmail,
    customerPhone: parsed.data.customerPhone,
    quote
  });

  return NextResponse.json({
    status: "pending_deposit",
    appointment,
    quote,
    checkout,
    notification
  });
}

import { NextResponse } from "next/server";
import { buildBookingQuote, createBookingSchema } from "@/lib/booking";
import { notifyOwnerOfBooking } from "@/lib/notifications";
import { createSquareDepositCheckout } from "@/lib/square";

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = createBookingSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid booking request.",
        issues: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const quote = buildBookingQuote(parsed.data);
  const checkout = await createSquareDepositCheckout(quote);
  const notification = await notifyOwnerOfBooking({
    customerName: parsed.data.customerName,
    customerEmail: parsed.data.customerEmail,
    customerPhone: parsed.data.customerPhone,
    quote
  });

  return NextResponse.json({
    status: "pending_deposit",
    quote,
    checkout,
    notification
  });
}

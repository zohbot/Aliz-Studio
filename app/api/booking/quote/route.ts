import { NextResponse } from "next/server";
import { bookingQuoteSchema, buildBookingQuote } from "@/lib/booking";

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = bookingQuoteSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid quote request.",
        issues: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  try {
    return NextResponse.json({
      quote: buildBookingQuote(parsed.data)
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to build booking quote."
      },
      { status: 404 }
    );
  }
}

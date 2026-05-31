import { NextResponse } from "next/server";
import { parseJsonRequest } from "@/lib/api-security";
import { bookingQuoteSchema, buildBookingQuote } from "@/lib/booking";

export async function POST(request: Request) {
  const json = await parseJsonRequest(request);

  if (!json.ok) {
    return json.response;
  }

  const parsed = bookingQuoteSchema.safeParse(json.data);

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
      quote: await buildBookingQuote(parsed.data)
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

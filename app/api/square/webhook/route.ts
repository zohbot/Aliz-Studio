import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const signature = request.headers.get("x-square-hmacsha256-signature");
  const body = await request.text();

  // Future integration point: verify Square webhook signature before mutating bookings.
  return NextResponse.json({
    received: true,
    verified: Boolean(signature && body),
    action: "square_webhook_stub"
  });
}

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const signature = request.headers.get("x-square-hmacsha256-signature");
  const contentLength = Number(request.headers.get("content-length") || 0);

  if (contentLength > 64_000) {
    return NextResponse.json({ error: "Webhook body is too large." }, { status: 413 });
  }

  const body = await request.text();
  const hasSigningKey = Boolean(process.env.SQUARE_WEBHOOK_SIGNATURE_KEY);

  // Future integration point: verify Square's webhook signature before mutating bookings.
  return NextResponse.json({
    received: true,
    verified: false,
    action: "square_webhook_stub",
    message:
      signature && body && hasSigningKey
        ? "Signature verification is intentionally not enabled in this mock build."
        : "Webhook received without production signature verification."
  });
}

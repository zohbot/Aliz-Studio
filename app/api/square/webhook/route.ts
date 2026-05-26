import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

function signaturesMatch(expected: string, actual: string) {
  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}

function buildSquareWebhookSignature(secret: string, signaturePayload: string) {
  return createHmac("sha256", secret).update(signaturePayload).digest("base64");
}

function isSquareWebhookSignatureEnabled() {
  return process.env.NODE_ENV === "production" || process.env.SQUARE_WEBHOOK_VERIFY === "true";
}

export async function POST(request: Request) {
  const signature = request.headers.get("x-square-hmacsha256-signature");
  const signatureEnabled = isSquareWebhookSignatureEnabled();
  const contentLength = Number(request.headers.get("content-length") || 0);

  if (Number.isNaN(contentLength) || contentLength < 0) {
    return NextResponse.json({ error: "Invalid content-length header." }, { status: 400 });
  }

  if (contentLength > 64_000) {
    return NextResponse.json({ error: "Webhook body is too large." }, { status: 413 });
  }

  const body = await request.text();

  if (!signatureEnabled) {
    return NextResponse.json({
      received: true,
      verified: false,
      action: "square_webhook_stub",
      message: "Webhook received without production signature verification."
    });
  }

  if (!signature) {
    return NextResponse.json({ error: "Missing Square webhook signature header." }, { status: 401 });
  }

  const signingKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

  if (!signingKey) {
    return NextResponse.json({ error: "Webhook signature key is not configured." }, { status: 500 });
  }

  const notificationUrl = new URL(request.url).toString();
  const expectedSignature = buildSquareWebhookSignature(signingKey, `${notificationUrl}${body}`);
  const signatureValues = signature
    .split(",")
    .map((candidate) => candidate.trim())
    .filter(Boolean);
  const hasMatchingSignature = signatureValues.some((candidate) => signaturesMatch(expectedSignature, candidate));

  if (!hasMatchingSignature) {
    return NextResponse.json(
      {
        error: "Invalid webhook signature."
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    received: true,
    verified: true,
    action: "square_webhook_received",
    message: "Webhook signature verified."
  });
}

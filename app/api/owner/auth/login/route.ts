import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createOwnerSessionToken,
  getOwnerCookieOptions,
  isValidOwnerLogin,
  ownerSessionCookieName
} from "@/lib/admin-auth";
import { assertSameOriginRequest, parseJsonRequest } from "@/lib/api-security";
import { clearRateLimit, consumeRateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  const originError = assertSameOriginRequest(request);

  if (originError) {
    return originError;
  }

  const json = await parseJsonRequest(request);

  if (!json.ok) {
    return json.response;
  }

  const parsed = loginSchema.safeParse(json.data);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid owner login." }, { status: 401 });
  }

  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const loginKey = `owner-login:${ipAddress}:${parsed.data.email.trim().toLowerCase()}`;
  const rateLimit = consumeRateLimit(loginKey, 6, 15 * 60 * 1000);

  if (!rateLimit.allowed) {
    const response = NextResponse.json(
      {
        error: "Too many login attempts. Please try again shortly."
      },
      { status: 429 }
    );

    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));

    return response;
  }

  if (!isValidOwnerLogin(parsed.data.email, parsed.data.password)) {
    return NextResponse.json(
      {
        error: "Invalid owner login."
      },
      { status: 401 }
    );
  }

  clearRateLimit(loginKey);

  const response = NextResponse.json({
    ok: true,
    redirectTo: "/owner/dashboard"
  });

  response.cookies.set(ownerSessionCookieName, createOwnerSessionToken(), getOwnerCookieOptions());

  return response;
}

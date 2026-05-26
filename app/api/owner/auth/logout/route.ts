import { NextResponse } from "next/server";
import { assertSameOriginRequest } from "@/lib/api-security";
import { getOwnerCookieOptions, ownerSessionCookieName } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const originError = assertSameOriginRequest(request);

  if (originError) {
    return originError;
  }

  const response = NextResponse.json({
    ok: true,
    redirectTo: "/owner/login"
  });

  response.cookies.set(ownerSessionCookieName, "", {
    ...getOwnerCookieOptions(),
    maxAge: 0
  });

  return response;
}

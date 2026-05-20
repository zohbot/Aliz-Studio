import { NextResponse } from "next/server";
import { assertSameOriginRequest } from "@/lib/api-security";
import { ownerSessionCookieName } from "@/lib/admin-auth";

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
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax"
  });

  return response;
}

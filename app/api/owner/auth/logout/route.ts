import { NextResponse } from "next/server";
import { ownerSessionCookieName } from "@/lib/admin-auth";

export async function POST() {
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

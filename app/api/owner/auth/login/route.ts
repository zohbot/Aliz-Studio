import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createOwnerSessionToken,
  getOwnerCookieOptions,
  isValidOwnerLogin,
  ownerSessionCookieName
} from "@/lib/admin-auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json());

  if (!parsed.success || !isValidOwnerLogin(parsed.data.email, parsed.data.password)) {
    return NextResponse.json(
      {
        error: "Invalid owner login."
      },
      { status: 401 }
    );
  }

  const response = NextResponse.json({
    ok: true,
    redirectTo: "/owner/dashboard"
  });

  response.cookies.set(ownerSessionCookieName, createOwnerSessionToken(), getOwnerCookieOptions());

  return response;
}

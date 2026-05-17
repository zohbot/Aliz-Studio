import { NextResponse } from "next/server";
import { getOwnerSession } from "@/lib/admin-auth";

export async function GET() {
  const session = await getOwnerSession();

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    session
  });
}

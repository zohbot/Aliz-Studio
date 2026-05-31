import { NextResponse } from "next/server";
import { getOwnerSession } from "@/lib/admin-auth";
import { listCustomerRecords } from "@/lib/customers";

export const runtime = "nodejs";

export async function GET() {
  const session = await getOwnerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    return NextResponse.json({
      customers: await listCustomerRecords()
    });
  } catch {
    return NextResponse.json(
      {
        error: "Customer records are temporarily unavailable."
      },
      { status: 503 }
    );
  }
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { exportFamilyData } from "@/lib/family/account";

/** Download the signed-in parent's whole family as JSON (no secrets included). */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "parent") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const data = await exportFamilyData(getDb(), session.familyId);
  return new NextResponse(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="pointsy-family-data.json"',
      "Cache-Control": "no-store",
    },
  });
}

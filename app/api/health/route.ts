import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";

// Always run fresh — this is a liveness/DB-connectivity probe (SPEC §7.5).
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await getDb().execute(sql`select 1`);
    return NextResponse.json({ status: "ok", db: "connected" });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        db: "unreachable",
        message: err instanceof Error ? err.message : "unknown error",
      },
      { status: 503 },
    );
  }
}

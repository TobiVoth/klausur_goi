import { NextResponse } from "next/server";
import { getOverallStats } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = getOverallStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Error in /api/stats:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

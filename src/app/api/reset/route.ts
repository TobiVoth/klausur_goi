import { NextResponse } from "next/server";
import { resetProgress } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    resetProgress();
    return NextResponse.json({ success: true, message: "Progress reset successfully" });
  } catch (error: any) {
    console.error("Error in /api/reset:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reset progress" },
      { status: 500 }
    );
  }
}
